import { Metadata } from "next";

export const metadata: Metadata = { title: "Zexy", description: "Production-grade creator monetization platform" };
'use client';

import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Radio, Users, X, MessageSquare, Send, Heart, Loader2 } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { Badge } from '@/components/ui/badge';
import { getSignalingSocket } from '@/services/signaling';
import { getRTCConfiguration } from '@/lib/webrtc';
import { useAuthContext } from '@/hooks/useAuth';

export default function MockLiveRoomPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuthContext();
  const roomId = params.roomId as string;
  
  const [viewers, setViewers] = useState(0);
  const [connected, setConnected] = useState(false);
  const [broadcasterExists, setBroadcasterExists] = useState(false);
  const [messages, setMessages] = useState([
    { id: 1, user: 'Rahul', text: 'Hey! So glad you are live!' },
    { id: 2, user: 'Sneha', text: 'Love the outfit today!' },
    { id: 3, user: 'Amit', text: 'Can you show the new product?' },
  ]);
  const [newMessage, setNewMessage] = useState('');

  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const socketRef = useRef<any>(null);
  const hasOfferRef = useRef(false);

  // WebRTC & Signaling Logic
  useEffect(() => {
    if (!roomId) return;

    const socket = getSignalingSocket();
    socketRef.current = socket;
    let pendingIceCandidates: any[] = [];

    const configuration = getRTCConfiguration();

    // Join the room for signaling
    socket.emit("viewer-join", roomId);
    socket.emit("get-viewer-count", roomId);

    socket.on("viewer-count", (count: number) => {
      setViewers(count - 1 > 0 ? count - 1 : 0);
    });

    socket.on("broadcaster", () => {
      console.log("[Signaling] Broadcaster is in the room");
      setBroadcasterExists(true);
    });

    const flushIce = async (pc: RTCPeerConnection) => {
      while (pendingIceCandidates.length > 0) {
          const cand = pendingIceCandidates.shift();
          try {
            await pc.addIceCandidate(new RTCIceCandidate(cand));
          } catch (e) {
            console.error("[WebRTC] Error flushing ICE", e);
          }
      }
    };

    socket.on("offer", async (payload: any) => {
      console.log("[Signaling] Received Offer from Broadcaster");
      hasOfferRef.current = true;
      
      const offer = payload.offer || payload;
      const broadcasterId = payload.broadcasterId;

      setBroadcasterExists(true);

      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
      }

      const pc = new RTCPeerConnection(configuration);
      // Explicitly request receive-only tracks
      pc.addTransceiver('video', { direction: 'recvonly' });
      pc.addTransceiver('audio', { direction: 'recvonly' });
      
      peerConnectionRef.current = pc;

      pc.onconnectionstatechange = () => {
        if (pc.connectionState === "disconnected" || pc.connectionState === "failed") {
           setConnected(false);
           setBroadcasterExists(false);
        }
      };

      pc.ontrack = (event) => {
        if (!remoteVideoRef.current) return;
        
        if (event.streams && event.streams[0]) {
            if (remoteVideoRef.current.srcObject !== event.streams[0]) {
              remoteVideoRef.current.srcObject = event.streams[0];
            }
        } else {
             if (!remoteVideoRef.current.srcObject) {
               remoteVideoRef.current.srcObject = new MediaStream();
             }
             (remoteVideoRef.current.srcObject as MediaStream).addTrack(event.track);
        }
        setConnected(true);
      };

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          socket.emit("ice-candidate-peer", { candidate: event.candidate, toId: broadcasterId });
        }
      };

      try {
        if (pc.signalingState === "stable") {
          await pc.setRemoteDescription(new RTCSessionDescription(offer));
          await flushIce(pc);
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          socket.emit("answer-broadcaster", { answer, broadcasterId });
        }
      } catch (err) {
        console.error("Error setting remote description", err);
      }
    });

    socket.on("ice-candidate", async (payload: any) => {
      const candidate = payload.candidate || payload;
      if (peerConnectionRef.current) {
        try {
            const pc = peerConnectionRef.current;
            if (pc.remoteDescription && pc.remoteDescription.type) {
                await pc.addIceCandidate(new RTCIceCandidate(candidate));
            } else {
                pendingIceCandidates.push(candidate);
            }
        } catch (e) {
          console.error("Error adding ICE candidate", e);
        }
      }
    });

    // Chat handling
    socket.on("chat", (data: any) => {
      if (data.roomId === roomId) {
        setMessages(prev => [...prev, { id: data.id, user: data.sender, text: data.message }]);
      }
    });

    // Pinging for sync
    const syncLoop = setInterval(() => {
      if (!hasOfferRef.current && socket.connected) {
         socket.emit("viewer-join", roomId); 
      }
    }, 4000);

    return () => {
      clearInterval(syncLoop);
      socket.off("broadcaster");
      socket.off("offer");
      socket.off("ice-candidate");
      socket.off("viewer-count");
      socket.off("chat");
      
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
      }
    };
  }, [roomId]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !socketRef.current) return;
    
    const sender = user?.name || user?.username || 'You';
    socketRef.current.emit("chat", { roomId, sender, message: newMessage });
    setNewMessage('');
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black flex flex-col md:flex-row">
      {/* Video Stream Area */}
      <div className="relative flex-1 bg-zinc-900 flex items-center justify-center overflow-hidden">
        {/* Real Video Stream */}
        <video 
          ref={remoteVideoRef} 
          autoPlay 
          playsInline 
          className={`w-full h-full ${connected ? 'object-cover' : 'hidden'}`}
        />

        {/* Fallback / Loading UI */}
        {!connected && (
          <div className="absolute inset-0 bg-gradient-to-br from-zinc-800 to-black flex items-center justify-center">
            {broadcasterExists ? (
              <div className="text-center space-y-4">
                <Loader2 className="size-12 text-red-500 mx-auto animate-spin" />
                <p className="text-lg font-medium text-zinc-400">Tuning in...</p>
              </div>
            ) : (
              <div className="text-center space-y-4">
                <Radio className="size-20 text-zinc-700 mx-auto" />
                <p className="text-lg font-medium text-zinc-400">Off Air</p>
                <p className="text-sm text-zinc-500 italic">Waiting for signal...</p>
              </div>
            )}
          </div>
        )}

        {/* Overlays */}
        <div className="absolute top-4 left-4 flex gap-2">
          <Badge className={`${connected ? 'bg-red-500' : 'bg-zinc-600'} text-white border-none px-2 py-1 flex items-center gap-1`}>
            <Radio className={`size-3 ${connected ? 'animate-pulse' : ''}`} />
            {connected ? 'LIVE' : 'WAITING'}
          </Badge>
          <Badge variant="secondary" className="bg-black/50 text-white border-none backdrop-blur-md flex items-center gap-1">
            <Users className="size-3" />
            {viewers}
          </Badge>
        </div>

        <button 
          onClick={() => router.back()}
          className="absolute top-4 right-4 size-10 bg-black/50 rounded-full flex items-center justify-center text-white backdrop-blur-md hover:bg-black/70"
        >
          <X className="size-6" />
        </button>

        <div className="absolute bottom-6 left-4 right-4 md:hidden">
            <div className="flex gap-2">
                 <Button className="flex-1 bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/20 rounded-full">
                    <Heart className="size-5 mr-2" />
                    Like
                 </Button>
                 <Button className="flex-1 bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/20 rounded-full">
                    <MessageSquare className="size-5 mr-2" />
                    Tip
                 </Button>
            </div>
        </div>
      </div>

      {/* Chat Area */}
      <div className="w-full md:w-80 h-1/3 md:h-full bg-black border-t md:border-t-0 md:border-l border-white/10 flex flex-col">
        <div className="p-4 border-b border-white/10 font-semibold text-sm tracking-wide">
          LIVE CHAT
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map(m => (
            <div key={m.id} className="text-sm">
              <span className="font-bold text-zinc-400 mr-2">{m.user}:</span>
              <span className="text-zinc-200">{m.text}</span>
            </div>
          ))}
        </div>

        <form onSubmit={handleSendMessage} className="p-4 border-t border-white/10 flex gap-2">
          <input 
            type="text" 
            placeholder="Say something..."
            className="flex-1 bg-zinc-900 border-none rounded-md px-3 py-2 text-sm focus:ring-1 focus:ring-primary outline-none"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
          />
          <Button type="submit" size="icon" className="shrink-0 rounded-full">
            <Send className="size-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}
