"use client"

import { Shield, Star, Swords, Trophy } from "lucide-react";
import Image from "next/image"

export const PlayerCard = () => {

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="w-[300px] relative">
        {/* Card Container */}
        <div className="bg-black rounded-3xl overflow-hidden relative">
          {/* Background texture */}
          <div 
            className="absolute inset-0 opacity-20"
            style={{
              backgroundImage: 'url("https://images.unsplash.com/photo-1536431311719-398b6704d4cc?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80")',
              backgroundSize: 'cover',
              backgroundPosition: 'center'
            }}
          />
          
          {/* Content Container */}
          <div className="relative p-6 text-white">
            {/* Top Section */}
            <div className="flex justify-between items-start mb-8">
              <div className="text-6xl font-bold">88</div>
              <div className="bg-gray-200 text-black px-2 py-1 rounded-md text-sm">
                Membership
              </div>
            </div>
            
            {/* Country and Rating */}
            <div className="mb-8">
              <div className="text-2xl font-bold mb-1">UK</div>
              <div className="text-3xl font-bold">4.7</div>
            </div>
            
            {/* Name */}
            <div className="text-3xl font-bold mb-8">ANGEL</div>
            
            {/* Stats Grid */}
            <div className="space-y-2 mb-8">
              <div className="flex items-center">
                <span className="w-28">places</span>
                <span className="mx-2">|</span>
                <span>12</span>
                <span className="mx-2">experiments</span>
                <span className="mx-2">|</span>
                <span>12</span>
              </div>
              <div className="flex items-center">
                <span className="w-28">places visited</span>
                <span className="mx-2">|</span>
                <span>12</span>
                <span className="mx-2">experiments</span>
                <span className="mx-2">|</span>
                <span>12</span>
              </div>
              <div className="flex items-center">
                <span className="w-28">places visited</span>
                <span className="mx-2">|</span>
                <span>12</span>
                <span className="mx-2">experiments</span>
                <span className="mx-2">|</span>
                <span>12</span>
              </div>
            </div>
            
            {/* Language */}
            <div className="text-lg">English</div>
          </div>
          
          {/* Profile Picture Circle */}
          <div className="absolute top-24 right-8 w-16 h-16 rounded-full border-2 border-white bg-gray-300"></div>
        </div>
        
        {/* Card Bottom Shape */}
        <div className="h-6 bg-black -skew-y-3 -mt-3 rounded-b-3xl"></div>
      </div>
    </div>
  );
}