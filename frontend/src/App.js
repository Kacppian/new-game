import React, { useState, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Stars, Environment, Box, Sphere, Cylinder } from '@react-three/drei';
import RobloxCharacter from './RobloxCharacter';
import ObbyEnvironment from './ObbyEnvironment';
import './App.css';

// Lego Skybox Component
function LegoSkybox() {
  return (
    <mesh>
      <sphereGeometry args={[500, 32, 32]} />
      <meshBasicMaterial 
        color="#87CEEB" 
        side={2} // THREE.BackSide
        transparent
        opacity={0.8}
      />
    </mesh>
  );
}

// Optimized Floating Lego Brick - simpler geometry for performance
function FloatingLegoBrick({ position, color, size = [2, 1, 2], rotationSpeed = 0.01 }) {
  const meshRef = useRef();
  
  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.rotation.y += rotationSpeed;
      meshRef.current.rotation.x += rotationSpeed * 0.3; // Reduced rotation complexity
    }
  });

  const [width, height, depth] = size;
  
  // Simplified studs - maximum 2 studs for performance
  const generateStuds = () => {
    const studs = [];
    const maxStuds = 2; // Drastically reduced from complex calculations
    
    if (width >= 2 && depth >= 2) {
      studs.push([0, height / 2 + 0.1, 0]); // Single central stud for small blocks
    }
    
    return studs;
  };

  const studPositions = generateStuds();

  return (
    <group ref={meshRef} position={position}>
      {/* Simplified brick body */}
      <Box args={size}>
        <meshStandardMaterial 
          color={color} 
          roughness={0.3}
          metalness={0.1}
          transparent
          opacity={0.7}
        />
      </Box>
      
      {/* Minimal studs for performance */}
      {studPositions.map((studPos, index) => (
        <Cylinder
          key={index}
          position={studPos}
          args={[0.2, 0.2, 0.1, 4]} // Much simpler geometry - 4 sides instead of 8
        >
          <meshStandardMaterial 
            color={color} 
            roughness={0.3}
            metalness={0.1}
            transparent
            opacity={0.7}
          />
        </Cylinder>
      ))}
    </group>
  );
}

// Highly optimized background elements - dramatically reduced for Windows performance
function LegoBackgroundElements() {
  const brickColors = ['#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#8E44AD', '#FFA500'];
  
  // Drastically reduced from 20 to 8 floating bricks for performance
  const [floatingBricks] = useState(() => 
    Array.from({ length: 8 }).map((_, i) => ({
      position: [
        (Math.random() - 0.5) * 150, // Reduced range
        Math.random() * 60 + 40, // Reduced range
        (Math.random() - 0.5) * 150 // Reduced range
      ],
      color: brickColors[Math.floor(Math.random() * brickColors.length)],
      size: [
        Math.random() * 2 + 1, // Smaller sizes
        Math.random() * 1 + 0.5,
        Math.random() * 2 + 1
      ],
      rotationSpeed: Math.random() * 0.01 + 0.002 // Slower rotation
    }))
  );

  // Reduced city skyline from 8 to 4 elements
  const [cityBricks] = useState(() =>
    Array.from({ length: 4 }).map((_, i) => ({
      position: [
        (i - 2) * 40, // Wider spacing
        Math.random() * 20 + 15,
        -150 - Math.random() * 30
      ],
      color: brickColors[Math.floor(Math.random() * brickColors.length)],
      size: [
        Math.random() * 4 + 3,
        Math.random() * 15 + 8,
        Math.random() * 4 + 3
      ]
    }))
  );
  
  return (
    <group>
      {/* Reduced floating Lego bricks */}
      {floatingBricks.map((brick, i) => (
        <FloatingLegoBrick
          key={i}
          position={brick.position}
          color={brick.color}
          size={brick.size}
          rotationSpeed={brick.rotationSpeed}
        />
      ))}
      
      {/* Reduced large background structures - only 2 instead of 3 */}
      <FloatingLegoBrick
        position={[-60, 50, -80]}
        color="#FF0000"
        size={[6, 3, 6]}
        rotationSpeed={0.003}
      />
      <FloatingLegoBrick
        position={[60, 60, -100]}
        color="#0066FF"
        size={[8, 2, 4]}
        rotationSpeed={0.005}
      />
      
      {/* Simplified ground plane */}
      <mesh position={[0, -5, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[300, 300]} /> {/* Smaller ground plane */}
        <meshStandardMaterial 
          color="#90EE90" 
          roughness={0.8}
          metalness={0.05}
        />
      </mesh>
      
      {/* Reduced city skyline */}
      {cityBricks.map((brick, i) => (
        <FloatingLegoBrick
          key={`city-${i}`}
          position={brick.position}
          color={brick.color}
          size={brick.size}
          rotationSpeed={0}
        />
      ))}
    </group>
  );
}

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
        gl={{ 
          antialias: false, // Disable antialiasing for better performance on Windows
          powerPreference: "high-performance",
          alpha: false
        }}
        frameloop="demand" // Only render when needed
        performance={{ min: 0.5 }} // Lower performance threshold
        gl={{ 
          antialias: false, // Disable antialiasing for better performance on Windows
          powerPreference: "high-performance",
          alpha: false
        }}
        frameloop="demand" // Only render when needed
        performance={{ min: 0.5 }} // Lower performance threshold
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
        <pointLight position={[0, 50, 0]} intensity={0.7} color="#ffffff" />
        {/* Additional atmospheric lighting for Lego world */}
        <ambientLight intensity={0.4} color="#f0f8ff" />
        <pointLight position={[-50, 30, -50]} intensity={0.3} color="#ff6b6b" />
        <pointLight position={[50, 30, -50]} intensity={0.3} color="#4ecdc4" />
        
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