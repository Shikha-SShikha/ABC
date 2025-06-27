import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import axios, { type AxiosResponse, type AxiosError } from "axios";
import logo from "../components/ui/TNQTech Logo.svg";

interface ChatMessage {
  id: string;
  content: string;
  isBot: boolean;
  timestamp: Date;
}

interface PreviousQuestion {
  id: string;
  question: string;
}

export default function Home() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isQueryStatsOpen, setIsQueryStatsOpen] = useState(false);
  const [clarificationPrompt, setClarificationPrompt] = useState<string | null>(null);
  const [clarificationNeeded, setClarificationNeeded] = useState<boolean>(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  
  const previousQuestions: PreviousQuestion[] = [];

  const suggestionChips = [
    { icon: "fas fa-search", text: "Missing values analysis", color: "blue" },
    { icon: "fas fa-users", text: "Top users by tasks", color: "green" },
    { icon: "fas fa-clock", text: "Average processing time", color: "yellow" },
    { icon: "fas fa-exclamation-triangle", text: "Duplicate detection", color: "red" },
  ];

  const handleSendMessage = () => {
    if (inputValue.trim()) {
      const newMessage: ChatMessage = {
        id: Date.now().toString(),
        content: inputValue,
        isBot: false,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, newMessage]);

      if (clarificationNeeded && sessionId) {
        console.log("clarificationNeeded", clarificationNeeded);
        // Send to /clarify endpoint
        axios.post("http://localhost:8000/clarify", {
          session_id: sessionId,
          clarification: inputValue,
          query: inputValue, // if your backend expects 'query', otherwise remove
        })
          .then((res: AxiosResponse) => {
            let clarifyContent = "";
            if (res.data.result) {
              clarifyContent = res.data.result;
            } else if (res.data.error) {
              clarifyContent = `Error: ${res.data.error}`;
            } else if (res.data.clarification_prompt) {
              clarifyContent = res.data.clarification_prompt;
            } else {
              clarifyContent = "No response from clarify endpoint.";
            }
            const clarifyBotMessage: ChatMessage = {
              id: (Date.now() + 1).toString(),
              content: clarifyContent,
              isBot: true,
              timestamp: new Date(),
            };
            setMessages((prev) => [...prev, clarifyBotMessage]);
            setClarificationPrompt(res.data.clarification_prompt ?? null);
            setClarificationNeeded(!!res.data.clarification_needed);
            setSessionId(res.data.session_id ?? null);
          })
          .catch((err: AxiosError) => {
            console.error(err);
            const errorBotMessage: ChatMessage = {
              id: (Date.now() + 2).toString(),
              content: `Error: ${err.message}`,
              isBot: true,
              timestamp: new Date(),
            };
            setMessages((prev) => [...prev, errorBotMessage]);
          });
      } else {
        // Send to /query endpoint
        axios.post("http://localhost:8000/query", {
          query: inputValue,
        })
          .then((res: AxiosResponse) => {
            let queryContent = "";
            if (res.data.clarification_prompt) {
              queryContent = res.data.clarification_prompt;
            } else if (res.data.result) {
              queryContent = res.data.result;
            } else if (res.data.error) {
              queryContent = `Error: ${res.data.error}`;
            } else {
              queryContent = "No response from query endpoint.";
            }
            const queryBotMessage: ChatMessage = {
              id: (Date.now() + 1).toString(),
              content: queryContent,
              isBot: true,
              timestamp: new Date(),
            };
            setMessages((prev) => [...prev, queryBotMessage]);

            setClarificationPrompt(res.data.clarification_prompt ?? null);
            setClarificationNeeded(res.data.clarification_needed ?? false);
            setSessionId(res.data.session_id ?? null);
          })
          .catch((err: AxiosError) => {
            console.error(err);
          });
      }
      setInputValue("");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSendMessage();
    }
  };

  const handleSuggestionClick = (text: string) => {
    setInputValue(`Tell me about ${text.toLowerCase()}`);
  };

  const handlePreviousQuestionClick = (question: string) => {
    setInputValue(question);
  };

  return (
    <div className="min-h-screen bg-[hsl(220,13%,96%)] font-['Source_Sans_Pro'] text-[hsl(218,16%,22%)]">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-2 flex items-center justify-between">
        <div className="flex items-center space-x-6">
  {/* TNQTECH Logo */}
  <div className="logo-container">
    <img src={logo} alt="TNQTech Logo" className="logo" style={{ width: '115px', height: '75px' }} />
  </div>
  {/* Data Insights block right next to logo */}
  <div className="text-left">
    <h2 className="text-xl font-semibold text-[hsl(218,16%,22%)]">Data Insights</h2>
    <p className="text-sm text-gray-600">Insights Before You Ask. Answers When You Do.</p>
  </div>
  {/* Stats and button remain to the right */}
  <div className="flex items-center space-x-4 ml-6">
    <div className="text-right">
      <span className="text-sm text-gray-600">📊 763,868 records loaded</span>
    </div>
    <Button 
      className="tnq-btn flex items-center space-x-2"
      onClick={() => setIsQueryStatsOpen(true)}
            >
              <i className="fas fa-chart-bar"></i>
              <span>Query Stats</span>
            </Button>
          </div>
        </div>
      </header>

      <div className="flex h-[calc(100vh-80px)]">
        {/* Sidebar */}
        <div className="w-72 bg-white shadow-lg border-r border-gray-200 flex flex-col">
          <div className="p-4 border-b border-gray-200">
            <h3 className="font-semibold text-[hsl(218,16%,22%)] flex items-center space-x-2">
              <i className="fas fa-history text-[hsl(228,86%,46%)]"></i>
              <span>History</span>
            </h3>
          </div>
          
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-2">
              {previousQuestions.length === 0 ? (
                <div className="text-center py-8">
                  <i className="fas fa-clock text-gray-400 text-2xl mb-2"></i>
                  <p className="text-sm text-gray-500">No history yet</p>
                  <p className="text-xs text-gray-400 mt-1">Your queries will appear here</p>
                </div>
              ) : (
                previousQuestions.map((question) => (
                  <div
                    key={question.id}
                    className="previous-question-item p-3 rounded-lg cursor-pointer"
                    onClick={() => handlePreviousQuestionClick(question.question)}
                  >
                    <p className="text-sm text-[hsl(218,16%,22%)] line-clamp-2">
                      {question.question}
                    </p>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Main Chat Interface */}
        <div className="flex-1 flex flex-col">
          {/* Chat Messages Area */}
          <ScrollArea className="flex-1 p-6 bg-white">
            <div className="max-w-4xl mx-auto space-y-6">
              {/* AI Welcome Message */}
              <div className="flex items-start space-x-4">
                <div className="w-10 h-10 bg-[hsl(228,86%,46%)] rounded-full flex items-center justify-center text-white font-semibold">
                  <i className="fas fa-robot"></i>
                </div>
                <div className="flex-1 chat-message-bot rounded-2xl rounded-tl-sm p-6">
                  <p className="text-[hsl(218,16%,22%)] leading-relaxed">
                    Hello! I'm your data assistant.
                  </p>
                  
                  <div className="mt-4">
                    <p className="text-sm text-[hsl(228,86%,46%)] font-semibold mb-3">Try asking me:</p>
                    
                    {/* Suggestion Chips */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {suggestionChips.map((chip, index) => (
                        <button
                          key={index}
                          className="suggestion-chip rounded-full px-4 py-3 text-left flex items-center space-x-3 group"
                          onClick={() => handleSuggestionClick(chip.text)}
                        >
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                            chip.color === 'blue' ? 'bg-blue-100 text-blue-600' :
                            chip.color === 'green' ? 'bg-green-100 text-green-600' :
                            chip.color === 'yellow' ? 'bg-yellow-100 text-yellow-600' :
                            'bg-red-100 text-red-600'
                          }`}>
                            <i className={chip.icon}></i>
                          </div>
                          <span className="text-sm font-medium text-[hsl(218,16%,22%)]">
                            {chip.text}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Chat Messages */}
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex items-start space-x-4 ${
                    message.isBot ? "" : "flex-row-reverse space-x-reverse"
                  }`}
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                    message.isBot 
                      ? "bg-[hsl(228,86%,46%)] text-white"
                      : "bg-gray-300 text-gray-700"
                  }`}>
                    <i className={message.isBot ? "fas fa-robot" : "fas fa-user"}></i>
                  </div>
                  <div className={`flex-1 rounded-2xl p-4 max-w-[70%] ${
                    message.isBot 
                      ? "chat-message-bot rounded-tl-sm"
                      : "bg-[hsl(228,86%,46%)] text-white rounded-tr-sm"
                  }`}>
                    <p className="leading-relaxed">{message.content}</p>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>

          {/* Chat Input */}
          <div className="border-t border-gray-200 bg-white p-6">
            <div className="max-w-4xl mx-auto">
              <div className="flex items-center space-x-4">
                <div className="flex-1 relative">
                  <Input
                    type="text"
                    placeholder="Ask me anything about your data..."
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyPress={handleKeyPress}
                    className="w-full px-6 py-4 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-[hsl(228,86%,46%)] focus:border-transparent text-[hsl(218,16%,22%)] placeholder-gray-500"
                  />
                </div>
                <Button
                  onClick={handleSendMessage}
                  className="tnq-btn p-4 rounded-full"
                >
                  <i className="fas fa-paper-plane"></i>
                </Button>
              </div>
              
              <div className="mt-2 text-center">
                <p className="text-xs text-gray-500">
                  AI may make mistakes. Consider checking important information.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Query Stats Modal */}
      <Dialog open={isQueryStatsOpen} onOpenChange={setIsQueryStatsOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
          <DialogHeader>
            <div className="tnq-gradient text-white p-6 -mx-6 -mt-6 mb-6">
              <DialogTitle className="text-xl font-bold text-white">Query Statistics</DialogTitle>
              <p className="text-blue-100">Detailed analytics for your data queries</p>
            </div>
          </DialogHeader>
          
          <ScrollArea className="max-h-96">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <Card className="bg-blue-50">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Total Queries</p>
                      <p className="text-2xl font-bold text-[hsl(228,86%,46%)]">1,247</p>
                    </div>
                    <i className="fas fa-search text-[hsl(228,86%,46%)] text-xl"></i>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-green-50">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Avg Response Time</p>
                      <p className="text-2xl font-bold text-green-600">2.4s</p>
                    </div>
                    <i className="fas fa-stopwatch text-green-600 text-xl"></i>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-purple-50">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Success Rate</p>
                      <p className="text-2xl font-bold text-purple-600">94.2%</p>
                    </div>
                    <i className="fas fa-check-circle text-purple-600 text-xl"></i>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <div className="space-y-4">
              <h3 className="font-semibold text-[hsl(218,16%,22%)]">Recent Query Performance</h3>
              <Card className="bg-gray-50">
                <CardContent className="p-4">
                  <p className="text-sm text-gray-600">
                    Query performance data and analytics would be displayed here with charts and detailed metrics.
                  </p>
                </CardContent>
              </Card>
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
}
