import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Box, Plane, Text, Cylinder, Sphere } from '@react-three/drei';
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

  // Define platform configurations
  const platformConfigs = [
    // Ground level
    { type: 'box', size: [8, 0.2, 8], color: '#8b4513' },
    // Level 1-5: Basic shapes with vibrant colors
    { type: 'box', size: [6, 0.2, 6], color: '#ff0080' },
    { type: 'cylinder', size: [5, 0.2, 16], color: '#00ff80' },
    { type: 'box', size: [7, 0.2, 3], color: '#8000ff' },
    { type: 'cross', size: [4, 0.2, 4], color: '#ff8000' },
    { type: 'cylinder', size: [4, 0.2, 16], color: '#0080ff' },
    // Level 6-10: More challenging shapes
    { type: 'L-shape', size: [5, 0.2, 3], color: '#ff0040' },
    { type: 'triangle', size: [5, 0.2, 5], color: '#40ff00' },
    { type: 'box', size: [3, 0.2, 7], color: '#ff4080' },
    { type: 'cylinder', size: [3.5, 0.2, 16], color: '#8040ff' },
    { type: 'diamond', size: [4, 0.2, 4], color: '#ff8040' },
    // Level 11-15: Advanced shapes
    { type: 'star', size: [4, 0.2, 4], color: '#40ffff' },
    { type: 'box', size: [2.5, 0.2, 5], color: '#ff4040' },
    { type: 'hexagon', size: [3.5, 0.2, 3.5], color: '#80ff40' },
    { type: 'T-shape', size: [4, 0.2, 3], color: '#4080ff' },
    { type: 'cylinder', size: [2.5, 0.2, 16], color: '#ff80ff' },
    // Level 16-20: Very challenging
    { type: 'thin-box', size: [1.5, 0.2, 4], color: '#ffff00' },
    { type: 'small-cross', size: [2.5, 0.2, 2.5], color: '#ff0000' },
    { type: 'cylinder', size: [2, 0.2, 16], color: '#00ffff' },
    { type: 'tiny-box', size: [2, 0.2, 2], color: '#ff00ff' },
    { type: 'final-platform', size: [3, 0.2, 3], color: '#ffd700' }
  ];

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

    // Collision detection with different platform shapes
    let onPlatform = false;
    
    for (let i = 0; i < platformConfigs.length; i++) {
      const platformY = i * 4;
      const config = platformConfigs[i];
      
      if (newPos.y <= platformY + 0.6 && newPos.y >= platformY - 0.5 && velocity.y <= 0) {
        let isOnThisPlatform = false;
        
        switch (config.type) {
          case 'box':
          case 'thin-box':
          case 'tiny-box':
            isOnThisPlatform = Math.abs(newPos.x) <= config.size[0]/2 && Math.abs(newPos.z) <= config.size[2]/2;
            break;
            
          case 'cylinder':
            isOnThisPlatform = Math.sqrt(newPos.x * newPos.x + newPos.z * newPos.z) <= config.size[0];
            break;
            
          case 'cross':
          case 'small-cross':
            const crossSize = config.size[0];
            isOnThisPlatform = (Math.abs(newPos.x) <= crossSize/2 && Math.abs(newPos.z) <= crossSize/6) ||
                             (Math.abs(newPos.z) <= crossSize/2 && Math.abs(newPos.x) <= crossSize/6);
            break;
            
          case 'L-shape':
            const lSize = config.size[0];
            isOnThisPlatform = (newPos.x >= -lSize/2 && newPos.x <= 0 && Math.abs(newPos.z) <= config.size[2]/2) ||
                             (newPos.z >= -config.size[2]/2 && newPos.z <= 0 && newPos.x >= -lSize/2 && newPos.x <= lSize/2);
            break;
            
          case 'triangle':
            const triSize = config.size[0];
            isOnThisPlatform = newPos.z >= -triSize/2 && newPos.z <= triSize/2 && 
                             Math.abs(newPos.x) <= (triSize/2) * (1 - (newPos.z + triSize/2) / triSize);
            break;
            
          case 'diamond':
            const diamondSize = config.size[0];
            isOnThisPlatform = Math.abs(newPos.x) + Math.abs(newPos.z) <= diamondSize/2;
            break;
            
          case 'star':
            const starSize = config.size[0];
            const angle = Math.atan2(newPos.z, newPos.x);
            const distance = Math.sqrt(newPos.x * newPos.x + newPos.z * newPos.z);
            const starRadius = starSize/3 * (1 + 0.3 * Math.cos(5 * angle));
            isOnThisPlatform = distance <= starRadius;
            break;
            
          case 'hexagon':
            const hexSize = config.size[0];
            const hexDistance = Math.sqrt(newPos.x * newPos.x + newPos.z * newPos.z);
            const hexAngle = Math.atan2(newPos.z, newPos.x);
            const hexRadius = hexSize/2 * Math.cos(Math.PI/6) / Math.cos((hexAngle % (Math.PI/3)) - Math.PI/6);
            isOnThisPlatform = hexDistance <= Math.abs(hexRadius);
            break;
            
          case 'T-shape':
            const tSize = config.size[0];
            isOnThisPlatform = (Math.abs(newPos.x) <= tSize/2 && newPos.z >= 0 && newPos.z <= config.size[2]/4) ||
                             (Math.abs(newPos.x) <= tSize/6 && newPos.z >= -config.size[2]/2 && newPos.z <= config.size[2]/2);
            break;
            
          case 'final-platform':
            isOnThisPlatform = Math.abs(newPos.x) <= config.size[0]/2 && Math.abs(newPos.z) <= config.size[2]/2;
            break;
        }
        
        if (isOnThisPlatform) {
          newPos.y = platformY + 0.6;
          newVelocity.y = 0;
          onPlatform = true;
          setIsGrounded(true);
          break;
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
    newPos.x = Math.max(-15, Math.min(15, newPos.x));
    newPos.z = Math.max(-15, Math.min(15, newPos.z));

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
      newPos.x + 12,
      newPos.y + 10,
      newPos.z + 12
    );
    camera.lookAt(newPos.x, newPos.y, newPos.z);
  });

  return (
    <Box ref={meshRef} position={position} args={[0.8, 1.6, 0.8]}>
      <meshStandardMaterial color="#4fc3f7" emissive="#0066cc" emissiveIntensity={0.2} />
    </Box>
  );
}

// Individual platform components
function CrossPlatform({ position, size, color }) {
  return (
    <group position={position}>
      <Box position={[0, 0, 0]} args={[size[0], size[1], size[0]/3]}>
        <meshStandardMaterial color={color} />
      </Box>
      <Box position={[0, 0, 0]} args={[size[0]/3, size[1], size[0]]}>
        <meshStandardMaterial color={color} />
      </Box>
    </group>
  );
}

function LPlatform({ position, size, color }) {
  return (
    <group position={position}>
      <Box position={[-size[0]/4, 0, 0]} args={[size[0]/2, size[1], size[2]]}>
        <meshStandardMaterial color={color} />
      </Box>
      <Box position={[0, 0, -size[2]/4]} args={[size[0], size[1], size[2]/2]}>
        <meshStandardMaterial color={color} />
      </Box>
    </group>
  );
}

function TrianglePlatform({ position, size, color }) {
  const geometry = new THREE.ConeGeometry(size[0]/2, size[1], 3);
  geometry.rotateX(-Math.PI / 2);
  
  return (
    <mesh position={position} geometry={geometry}>
      <meshStandardMaterial color={color} />
    </mesh>
  );
}

function DiamondPlatform({ position, size, color }) {
  const geometry = new THREE.ConeGeometry(size[0]/2, size[1], 4);
  geometry.rotateX(-Math.PI / 2);
  geometry.rotateY(Math.PI / 4);
  
  return (
    <mesh position={position} geometry={geometry}>
      <meshStandardMaterial color={color} />
    </mesh>
  );
}

function StarPlatform({ position, size, color }) {
  const shape = new THREE.Shape();
  const outerRadius = size[0]/2;
  const innerRadius = outerRadius * 0.4;
  
  for (let i = 0; i < 10; i++) {
    const angle = (i / 10) * Math.PI * 2;
    const radius = i % 2 === 0 ? outerRadius : innerRadius;
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius;
    
    if (i === 0) {
      shape.moveTo(x, y);
    } else {
      shape.lineTo(x, y);
    }
  }
  
  const geometry = new THREE.ExtrudeGeometry(shape, { depth: size[1], bevelEnabled: false });
  geometry.rotateX(-Math.PI / 2);
  
  return (
    <mesh position={position} geometry={geometry}>
      <meshStandardMaterial color={color} />
    </mesh>
  );
}

function HexagonPlatform({ position, size, color }) {
  const geometry = new THREE.CylinderGeometry(size[0]/2, size[0]/2, size[1], 6);
  
  return (
    <mesh position={position} geometry={geometry}>
      <meshStandardMaterial color={color} />
    </mesh>
  );
}

function TPlatform({ position, size, color }) {
  return (
    <group position={position}>
      <Box position={[0, 0, size[2]/4]} args={[size[0], size[1], size[2]/2]}>
        <meshStandardMaterial color={color} />
      </Box>
      <Box position={[0, 0, -size[2]/4]} args={[size[0]/3, size[1], size[2]/2]}>
        <meshStandardMaterial color={color} />
      </Box>
    </group>
  );
}

// Tower component with varied platforms
function Tower() {
  const platformConfigs = [
    // Ground level
    { type: 'box', size: [8, 0.2, 8], color: '#8b4513' },
    // Level 1-5: Basic shapes with vibrant colors
    { type: 'box', size: [6, 0.2, 6], color: '#ff0080' },
    { type: 'cylinder', size: [5, 0.2, 16], color: '#00ff80' },
    { type: 'box', size: [7, 0.2, 3], color: '#8000ff' },
    { type: 'cross', size: [4, 0.2, 4], color: '#ff8000' },
    { type: 'cylinder', size: [4, 0.2, 16], color: '#0080ff' },
    // Level 6-10: More challenging shapes
    { type: 'L-shape', size: [5, 0.2, 3], color: '#ff0040' },
    { type: 'triangle', size: [5, 0.2, 5], color: '#40ff00' },
    { type: 'box', size: [3, 0.2, 7], color: '#ff4080' },
    { type: 'cylinder', size: [3.5, 0.2, 16], color: '#8040ff' },
    { type: 'diamond', size: [4, 0.2, 4], color: '#ff8040' },
    // Level 11-15: Advanced shapes
    { type: 'star', size: [4, 0.2, 4], color: '#40ffff' },
    { type: 'box', size: [2.5, 0.2, 5], color: '#ff4040' },
    { type: 'hexagon', size: [3.5, 0.2, 3.5], color: '#80ff40' },
    { type: 'T-shape', size: [4, 0.2, 3], color: '#4080ff' },
    { type: 'cylinder', size: [2.5, 0.2, 16], color: '#ff80ff' },
    // Level 16-20: Very challenging
    { type: 'thin-box', size: [1.5, 0.2, 4], color: '#ffff00' },
    { type: 'small-cross', size: [2.5, 0.2, 2.5], color: '#ff0000' },
    { type: 'cylinder', size: [2, 0.2, 16], color: '#00ffff' },
    { type: 'tiny-box', size: [2, 0.2, 2], color: '#ff00ff' },
    { type: 'final-platform', size: [3, 0.2, 3], color: '#ffd700' }
  ];

  const platforms = [];
  
  platformConfigs.forEach((config, i) => {
    const platformY = i * 4;
    const position = [0, platformY, 0];
    
    // Add platform based on type
    switch (config.type) {
      case 'box':
      case 'thin-box':
      case 'tiny-box':
      case 'final-platform':
        platforms.push(
          <Box key={i} position={position} args={config.size}>
            <meshStandardMaterial 
              color={config.color} 
              emissive={config.type === 'final-platform' ? '#332200' : '#000000'} 
              emissiveIntensity={config.type === 'final-platform' ? 0.3 : 0}
            />
          </Box>
        );
        break;
        
      case 'cylinder':
        platforms.push(
          <Cylinder key={i} position={position} args={[config.size[0], config.size[0], config.size[1], config.size[2]]}>
            <meshStandardMaterial color={config.color} />
          </Cylinder>
        );
        break;
        
      case 'cross':
      case 'small-cross':
        platforms.push(
          <CrossPlatform key={i} position={position} size={config.size} color={config.color} />
        );
        break;
        
      case 'L-shape':
        platforms.push(
          <LPlatform key={i} position={position} size={config.size} color={config.color} />
        );
        break;
        
      case 'triangle':
        platforms.push(
          <TrianglePlatform key={i} position={position} size={config.size} color={config.color} />
        );
        break;
        
      case 'diamond':
        platforms.push(
          <DiamondPlatform key={i} position={position} size={config.size} color={config.color} />
        );
        break;
        
      case 'star':
        platforms.push(
          <StarPlatform key={i} position={position} size={config.size} color={config.color} />
        );
        break;
        
      case 'hexagon':
        platforms.push(
          <HexagonPlatform key={i} position={position} size={config.size} color={config.color} />
        );
        break;
        
      case 'T-shape':
        platforms.push(
          <TPlatform key={i} position={position} size={config.size} color={config.color} />
        );
        break;
    }
    
    // Add floor number
    if (i > 0) {
      platforms.push(
        <Text
          key={`text-${i}`}
          position={[0, platformY + 1.5, 0]}
          fontSize={0.5}
          color="white"
          anchorX="center"
          anchorY="middle"
        >
          Floor {i}
        </Text>
      );
    }
  });

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
      🎉 VICTORY! 🎉{'\n'}You conquered the Hell Tower!
    </Text>
  );
}

// Game component
function Game() {
  const [playerPosition, setPlayerPosition] = useState({ x: 0, y: 1, z: 0 });

  return (
    <Canvas
      style={{ height: '100vh', background: 'linear-gradient(to top, #1a0000, #330000, #000)' }}
      camera={{ position: [12, 10, 12], fov: 60 }}
    >
      {/* Enhanced lighting */}
      <ambientLight intensity={0.4} color="#ff4400" />
      <directionalLight position={[10, 20, 5]} intensity={1} color="#ff6600" />
      <pointLight position={[0, 50, 0]} intensity={1.5} color="#ff0000" />
      <spotLight position={[0, 80, 0]} angle={0.3} penumbra={1} intensity={2} color="#ffd700" />

      {/* Game objects */}
      <Tower />
      <Player position={[0, 1, 0]} onPositionChange={setPlayerPosition} />
      <VictoryMessage playerY={playerPosition.y} />

      {/* Ground */}
      <Plane position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]} args={[30, 30]}>
        <meshStandardMaterial color="#2b1810" />
      </Plane>

      {/* Disabled orbit controls */}
      <OrbitControls enabled={false} />
    </Canvas>
  );
}

// UI Component
function GameUI({ playerY }) {
  const currentFloor = Math.max(0, Math.floor(playerY / 4));
  const progress = Math.min(100, (currentFloor / 20) * 100);

  return (
    <div className="game-ui">
      <div className="ui-panel">
        <h2>Hell Tower Climb</h2>
        <div className="stats">
          <div>Floor: {currentFloor}/20</div>
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
        <div>Goal: Reach Floor 20!</div>
        <div style={{ marginTop: '10px', fontSize: '12px', color: '#ffaa00' }}>
          Navigate unique shaped platforms!
        </div>
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