import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X, Send, Mic, Heart, Bot, User, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
import { analyzeHealthSymptoms, generateHealthResponse, isEmergencySituation, loadExternalHealthData } from '@/lib/healthChatbot';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Initial greeting
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([{
        role: 'assistant',
        content: "🩸 Hello! I'm the LIFELINE-X Health Assistant. How can I help you today?\n\n**I can:**\n• 🏥 Analyze your health symptoms\n• 🔍 Suggest possible conditions\n• ⚕️ Provide medical precautions\n• 🚨 Detect emergency situations\n• 🩸 Guide you to blood banks\n\n**Describe your symptoms clearly.** For example: 'I have a high fever and chest pain' or 'I'm experiencing dizziness and nausea'."
      }]);
    }
  }, [isOpen, messages.length]);

  // Try loading any external CSV datasets placed in public/health_chatbot/
  useEffect(() => {
    loadExternalHealthData().catch(err => {
      // not fatal; continue with built-in rules
      console.warn('Failed to load external health chatbot data', err);
    });
  }, []);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      // Check for emergency situation
      if (isEmergencySituation(userMessage)) {
        const emergencyMessage = `🚨 **EMERGENCY DETECTED!**\n\nBased on your message, you may be in an emergency situation. **PLEASE CALL EMERGENCY SERVICES (911/999) IMMEDIATELY** or go to the nearest hospital.\n\nDon't wait - get professional medical help NOW!\n\nAfter seeking medical help, you can tell me more about your symptoms and I'll provide additional guidance.`;
        setMessages(prev => [...prev, { role: 'assistant', content: emergencyMessage }]);
        setIsLoading(false);
        return;
      }

      // Analyze health symptoms
      const analysis = analyzeHealthSymptoms(userMessage);
      const assistantMessage = generateHealthResponse(analysis, userMessage);

      setMessages(prev => [...prev, { role: 'assistant', content: assistantMessage }]);
    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: '❌ Sorry, I encountered an error. Please try again with a clear description of your symptoms.' 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmergency = () => {
    setIsOpen(false);
    navigate('/');
    // Scroll to emergency button
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 100);
  };

  return (
    <>
      {/* Floating Chat Button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setIsOpen(true)}
            className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center"
          >
            <MessageCircle className="w-6 h-6" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-6 right-6 z-50 w-[360px] max-w-[calc(100vw-48px)] h-[500px] max-h-[calc(100vh-120px)]"
          >
            <Card variant="elevated" className="h-full flex flex-col overflow-hidden">
              {/* Header */}
              <div className="p-4 border-b bg-primary/5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Bot className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm">LIFELINE-X Assistant</h3>
                    <p className="text-xs text-muted-foreground">Emergency Support • 24/7</p>
                  </div>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)}>
                  <X className="w-5 h-5" />
                </Button>
              </div>

              {/* Emergency Quick Action */}
              <div className="p-2 border-b">
                <Button 
                  variant="emergency-outline" 
                  size="sm" 
                  className="w-full"
                  onClick={handleEmergency}
                >
                  <Heart className="w-4 h-4" />
                  Quick Emergency - Tap Here
                </Button>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((msg, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    {msg.role === 'assistant' && (
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Bot className="w-4 h-4 text-primary" />
                      </div>
                    )}
                    <div
                      className={`max-w-[80%] p-3 rounded-2xl text-sm whitespace-pre-wrap ${
                        msg.role === 'user'
                          ? 'bg-primary text-primary-foreground rounded-br-sm'
                          : 'bg-muted rounded-bl-sm'
                      }`}
                    >
                      {msg.content}
                    </div>
                    {msg.role === 'user' && (
                      <div className="w-8 h-8 rounded-lg bg-secondary/20 flex items-center justify-center flex-shrink-0">
                        <User className="w-4 h-4 text-secondary" />
                      </div>
                    )}
                  </motion.div>
                ))}
                {isLoading && messages[messages.length - 1]?.role === 'user' && (
                  <div className="flex gap-2">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Bot className="w-4 h-4 text-primary" />
                    </div>
                    <div className="bg-muted p-3 rounded-2xl rounded-bl-sm">
                      <motion.div className="flex gap-1">
                        {[0, 1, 2].map(i => (
                          <motion.div
                            key={i}
                            className="w-2 h-2 rounded-full bg-muted-foreground/50"
                            animate={{ y: [0, -4, 0] }}
                            transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.1 }}
                          />
                        ))}
                      </motion.div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="p-4 border-t">
                <form 
                  onSubmit={(e) => { e.preventDefault(); handleSend(); }}
                  className="flex gap-2"
                >
                  <Input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Type your message..."
                    className="flex-1"
                    disabled={isLoading}
                  />
                  <Button type="submit" size="icon" disabled={isLoading || !input.trim()}>
                    <Send className="w-4 h-4" />
                  </Button>
                </form>
                <p className="text-xs text-center text-muted-foreground mt-2">
                  Telugu • Hindi • English supported
                </p>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
