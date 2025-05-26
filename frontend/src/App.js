import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Box, Plane, Text } from '@react-three/drei';
import * as THREE from 'three';
import './App.css';

// Player component
function Player({ position, onPositionChange }) {
  const meshRef = useRef();
  const { camera } = useThree();
  
  const [velocity, setVelocity] = useState({ x: 0, y: 0, z: 0 });
  const [isGrounded, setIsGrounded] = useState(false);
  const [keys, setKeys] = useState({});

  // Handle keyboard input
  useEffect(() => {
    const handleKeyDown = (event) => {
      setKeys(prev => ({ ...prev, [event.code]: true }));
    };
    
    const handleKeyUp = (event) => {
      setKeys(prev => ({ ...prev, [event.code]: false }));
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Physics and movement
  useFrame((state, delta) => {
    if (!meshRef.current) return;

    const moveSpeed = 8;
    const jumpForce = 12;
    const gravity = -25;

    // Get current position
    const currentPos = meshRef.current.position;
    
    // Apply gravity
    let newVelocity = { ...velocity };
    newVelocity.y += gravity * delta;

    // Handle movement
    if (keys['KeyA'] || keys['ArrowLeft']) {
      newVelocity.x = -moveSpeed;
    } else if (keys['KeyD'] || keys['ArrowRight']) {
      newVelocity.x = moveSpeed;
    } else {
      newVelocity.x *= 0.8; // Friction
    }

    if (keys['KeyW'] || keys['ArrowUp']) {
      newVelocity.z = -moveSpeed;
    } else if (keys['KeyS'] || keys['ArrowDown']) {
      newVelocity.z = moveSpeed;
    } else {
      newVelocity.z *= 0.8; // Friction
    }

    // Jumping
    if ((keys['Space'] || keys['KeyW']) && isGrounded) {
      newVelocity.y = jumpForce;
      setIsGrounded(false);
    }

    // Update position
    const newPos = {
      x: currentPos.x + newVelocity.x * delta,
      y: currentPos.y + newVelocity.y * delta,
      z: currentPos.z + newVelocity.z * delta
    };

    // Simple collision detection with platforms
    let onPlatform = false;
    
    // Check collision with tower platforms
    for (let i = 0; i < 20; i++) {
      const platformY = i * 4;
      const platformSize = 6 - (i * 0.1); // Platforms get smaller as you go up
      
      // Check if player is on a platform
      if (newPos.y <= platformY + 0.6 && newPos.y >= platformY - 0.5 &&
          Math.abs(newPos.x) <= platformSize/2 && Math.abs(newPos.z) <= platformSize/2) {
        if (velocity.y <= 0) { // Only land when falling
          newPos.y = platformY + 0.6;
          newVelocity.y = 0;
          onPlatform = true;
          setIsGrounded(true);
        }
      }
    }

    // Ground collision
    if (newPos.y <= 0.5) {
      newPos.y = 0.5;
      newVelocity.y = 0;
      onPlatform = true;
      setIsGrounded(true);
    }

    if (!onPlatform && newVelocity.y <= 0) {
      setIsGrounded(false);
    }

    // Keep player within reasonable bounds
    newPos.x = Math.max(-10, Math.min(10, newPos.x));
    newPos.z = Math.max(-10, Math.min(10, newPos.z));

    // Reset if player falls too far
    if (newPos.y < -10) {
      newPos.x = 0;
      newPos.y = 1;
      newPos.z = 0;
      newVelocity = { x: 0, y: 0, z: 0 };
    }

    meshRef.current.position.set(newPos.x, newPos.y, newPos.z);
    setVelocity(newVelocity);
    
    if (onPositionChange) {
      onPositionChange(newPos);
    }

    // Update camera to follow player
    camera.position.set(
      newPos.x + 10,
      newPos.y + 8,
      newPos.z + 10
    );
    camera.lookAt(newPos.x, newPos.y, newPos.z);
  });

  return (
    <Box ref={meshRef} position={position} args={[0.8, 1.6, 0.8]}>
      <meshStandardMaterial color="#4fc3f7" />
    </Box>
  );
}

// Tower component with platforms
function Tower() {
  const platforms = [];
  
  // Create platforms going up
  for (let i = 0; i < 20; i++) {
    const platformY = i * 4;
    const platformSize = 6 - (i * 0.1); // Get smaller as you go up
    const hue = 0 + (i * 5); // Shift color as you go up
    
    platforms.push(
      <group key={i}>
        {/* Main platform */}
        <Box position={[0, platformY, 0]} args={[platformSize, 0.2, platformSize]}>
          <meshStandardMaterial color={`hsl(${hue}, 60%, ${30 + i * 2}%)`} />
        </Box>
        
        {/* Platform supports */}
        <Box position={[-platformSize/3, platformY - 1, -platformSize/3]} args={[0.3, 2, 0.3]}>
          <meshStandardMaterial color="#8b4513" />
        </Box>
        <Box position={[platformSize/3, platformY - 1, -platformSize/3]} args={[0.3, 2, 0.3]}>
          <meshStandardMaterial color="#8b4513" />
        </Box>
        <Box position={[-platformSize/3, platformY - 1, platformSize/3]} args={[0.3, 2, 0.3]}>
          <meshStandardMaterial color="#8b4513" />
        </Box>
        <Box position={[platformSize/3, platformY - 1, platformSize/3]} args={[0.3, 2, 0.3]}>
          <meshStandardMaterial color="#8b4513" />
        </Box>
        
        {/* Floor number */}
        {i > 0 && (
          <Text
            position={[0, platformY + 1, 0]}
            fontSize={0.5}
            color="white"
            anchorX="center"
            anchorY="middle"
          >
            Floor {i}
          </Text>
        )}
      </group>
    );
  }

  return <group>{platforms}</group>;
}

// Victory message component
function VictoryMessage({ playerY }) {
  const isAtTop = playerY > 75; // Player reached the top
  
  if (!isAtTop) return null;
  
  return (
    <Text
      position={[0, 85, 0]}
      fontSize={2}
      color="#ffd700"
      anchorX="center"
      anchorY="middle"
    >
      🎉 VICTORY! 🎉{'\n'}You reached the top!
    </Text>
  );
}

// Game component
function Game() {
  const [playerPosition, setPlayerPosition] = useState({ x: 0, y: 1, z: 0 });

  return (
    <Canvas
      style={{ height: '100vh', background: 'linear-gradient(to top, #1a0000, #330000, #000)' }}
      camera={{ position: [10, 8, 10], fov: 60 }}
    >
      {/* Lighting */}
      <ambientLight intensity={0.3} color="#ff4400" />
      <directionalLight position={[10, 10, 5]} intensity={0.8} color="#ff6600" />
      <pointLight position={[0, 50, 0]} intensity={1} color="#ff0000" />

      {/* Game objects */}
      <Tower />
      <Player position={[0, 1, 0]} onPositionChange={setPlayerPosition} />
      <VictoryMessage playerY={playerPosition.y} />

      {/* Ground */}
      <Plane position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]} args={[20, 20]}>
        <meshStandardMaterial color="#2b1810" />
      </Plane>

      {/* Controls (disabled since we're using custom camera) */}
      <OrbitControls enabled={false} />
    </Canvas>
  );
}

// UI Component
function GameUI({ playerY }) {
  const currentFloor = Math.max(0, Math.floor(playerY / 4));
  const progress = Math.min(100, (currentFloor / 19) * 100);

  return (
    <div className="game-ui">
      <div className="ui-panel">
        <h2>Hell Tower Climb</h2>
        <div className="stats">
          <div>Floor: {currentFloor}/19</div>
          <div>Height: {Math.round(playerY)}m</div>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${progress}%` }}></div>
          </div>
          <div>{Math.round(progress)}% Complete</div>
        </div>
      </div>
      
      <div className="controls-panel">
        <h3>Controls:</h3>
        <div>WASD / Arrow Keys - Move</div>
        <div>SPACE / W - Jump</div>
        <div>Goal: Reach Floor 19!</div>
      </div>
    </div>
  );
}

// Main App
function App() {
  const [playerPosition, setPlayerPosition] = useState({ x: 0, y: 1, z: 0 });

  return (
    <div className="App">
      <Game />
      <GameUI playerY={playerPosition.y} />
    </div>
  );
}

export default App;