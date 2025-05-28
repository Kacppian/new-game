import React, { useState, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { Environment, Stars } from '@react-three/drei';
import RobloxCharacter from './RobloxCharacter';
import ObbyEnvironment from './ObbyEnvironment';
import './App.css';

// Game UI component
function GameUI({ playerPosition, checkpointCount }) {
  const height = Math.round(playerPosition.y);
  const progress = Math.min(100, (height / 45) * 100);
  
  // Determine zone based on height
  const getZone = () => {
    if (height < 10) return "🟢 Spawn Zone";
    if (height < 20) return "🔵 Basic Parkour";
    if (height < 30) return "🔴 Danger Zone";
    if (height < 35) return "🟡 Speed Zone";
    if (height < 40) return "🟠 Spinner Zone";
    return "🏆 Victory Zone";
  };

  const getStage = () => {
    if (height < 5) return "Tutorial";
    if (height < 15) return "Stage 1: Learning";
    if (height < 25) return "Stage 2: Precision";
    if (height < 30) return "Stage 3: Movement";
    if (height < 35) return "Stage 4: Speed";
    if (height < 40) return "Stage 5: Challenge";
    return "🎉 VICTORY! 🎉";
  };

  return (
    <div className="game-ui">
      <div className="ui-panel roblox-style">
        <h2>🎮 ROBLOX OBBY</h2>
        <div className="stats">
          <div className="stat-row">
            <span className="stat-label">Stage:</span>
            <span className="stat-value">{getStage()}</span>
          </div>
          <div className="stat-row">
            <span className="stat-label">Height:</span>
            <span className="stat-value">{height}m</span>
          </div>
          <div className="stat-row">
            <span className="stat-label">Zone:</span>
            <span className="stat-value">{getZone()}</span>
          </div>
          <div className="stat-row">
            <span className="stat-label">Checkpoints:</span>
            <span className="stat-value">{checkpointCount}</span>
          </div>
          <div className="stat-row">
            <span className="stat-label">Progress:</span>
            <span className="stat-value">{progress.toFixed(1)}%</span>
          </div>
        </div>
        <div className="progress-bar roblox">
          <div className="progress-fill" style={{ width: `${progress}%` }}></div>
        </div>
      </div>
      

      
      {progress >= 100 && (
        <div className="victory-message">
          <h1>🎉 CONGRATULATIONS! 🎉</h1>
          <p>You completed the Roblox Obby!</p>
          <p>You are a true parkour master! 🏆</p>
        </div>
      )}
    </div>
  );
}

// Main App Component
function App() {
  const [playerPosition, setPlayerPosition] = useState({ x: 0, y: 0, z: 0 });
  const [checkpointCount, setCheckpointCount] = useState(0);

  const handlePositionChange = (position) => {
    setPlayerPosition(position);
  };

  const handleCheckpointReached = (count) => {
    setCheckpointCount(count);
  };

  return (
    <div className="App">
      {/* Game UI Overlay */}
      <GameUI 
        playerPosition={playerPosition} 
        checkpointCount={checkpointCount}
      />
      
      {/* 3D Scene */}
      <Canvas
        camera={{ 
          position: [15, 8, 15], 
          fov: 75,
          near: 0.1,
          far: 1000
        }}
        shadows
        style={{ height: '100vh', width: '100vw' }}
      >
        {/* Lighting Setup */}
        <ambientLight intensity={0.6} />
        <directionalLight
          position={[20, 30, 20]}
          intensity={1}
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
          shadow-camera-far={100}
          shadow-camera-left={-30}
          shadow-camera-right={30}
          shadow-camera-top={30}
          shadow-camera-bottom={-30}
        />
        <pointLight position={[0, 50, 0]} intensity={0.5} color="#ffffff" />
        
        {/* Lego-themed Sky and Environment */}
        <LegoSkybox />
        <LegoBackgroundElements />
        
        {/* Fog for atmosphere - Lego blue sky color */}
        <fog attach="fog" args={['#4A90E2', 60, 250]} />
        
        {/* Game Elements */}
        <ObbyEnvironment />
        <RobloxCharacter 
          position={[0, 0.75, 0]} 
          onPositionChange={handlePositionChange}
          onCheckpointReached={handleCheckpointReached}
        />
      </Canvas>
    </div>
  );
}

export default App;