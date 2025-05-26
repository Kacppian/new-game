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

  // Define all climbable elements for collision detection
  const getClimbableElements = () => {
    const elements = [];
    
    // Ground
    elements.push({ type: 'box', pos: [0, 0, 0], size: [12, 0.2, 12] });
    
    // Floor 1: Stepping stones in a circle
    const floor1Y = 4;
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const x = Math.cos(angle) * 3;
      const z = Math.sin(angle) * 3;
      elements.push({ type: 'box', pos: [x, floor1Y, z], size: [1.2, 0.3, 1.2] });
    }
    // Center platform
    elements.push({ type: 'box', pos: [0, floor1Y + 1, 0], size: [2, 0.3, 2] });
    
    // Floor 2: Bouncing spheres and boxes
    const floor2Y = 8;
    elements.push({ type: 'sphere', pos: [-2, floor2Y, -2], size: [0.8] });
    elements.push({ type: 'box', pos: [0, floor2Y + 0.5, 0], size: [1, 1, 1] });
    elements.push({ type: 'sphere', pos: [2, floor2Y + 0.3, 2], size: [0.8] });
    elements.push({ type: 'box', pos: [-3, floor2Y + 1, 3], size: [1.5, 0.3, 1.5] });
    elements.push({ type: 'box', pos: [3, floor2Y + 1.5, -1], size: [1, 0.3, 2] });
    
    // Floor 3: Ladder-like vertical elements
    const floor3Y = 12;
    for (let i = 0; i < 5; i++) {
      elements.push({ type: 'box', pos: [-2, floor3Y + i * 0.7, 0], size: [0.3, 0.3, 2] });
      elements.push({ type: 'box', pos: [2, floor3Y + i * 0.7, 0], size: [0.3, 0.3, 2] });
    }
    elements.push({ type: 'box', pos: [0, floor3Y + 3, 0], size: [3, 0.3, 1] });
    
    // Floor 4: Spiral staircase
    const floor4Y = 16;
    for (let i = 0; i < 12; i++) {
      const angle = (i / 12) * Math.PI * 2;
      const radius = 2.5;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      const y = floor4Y + (i * 0.3);
      elements.push({ type: 'box', pos: [x, y, z], size: [0.8, 0.2, 0.8] });
    }
    
    // Floor 5: Floating platforms
    const floor5Y = 20;
    elements.push({ type: 'box', pos: [-3, floor5Y, -3], size: [1.5, 0.3, 1.5] });
    elements.push({ type: 'sphere', pos: [0, floor5Y + 0.5, 0], size: [1] });
    elements.push({ type: 'box', pos: [3, floor5Y + 1, 3], size: [1.5, 0.3, 1.5] });
    elements.push({ type: 'box', pos: [-2, floor5Y + 1.5, 2], size: [1, 0.3, 1] });
    elements.push({ type: 'box', pos: [1, floor5Y + 2, -2], size: [1, 0.3, 1] });
    
    // Floor 6: Zigzag pattern
    const floor6Y = 24;
    const zigzagPoints = [
      [-4, 0, -4], [-2, 0.5, -2], [0, 1, 0], [2, 1.5, 2], [4, 2, 4],
      [3, 2.5, -3], [1, 3, -1], [-1, 3.5, 1], [-3, 4, 3]
    ];
    zigzagPoints.forEach(([x, yOffset, z]) => {
      elements.push({ type: 'box', pos: [x, floor6Y + yOffset, z], size: [1, 0.3, 1] });
    });
    
    // Floor 7: Column climbing
    const floor7Y = 28;
    elements.push({ type: 'cylinder', pos: [-2, floor7Y + 1, -2], size: [0.5, 2, 16] });
    elements.push({ type: 'cylinder', pos: [2, floor7Y + 2, 2], size: [0.5, 4, 16] });
    elements.push({ type: 'cylinder', pos: [0, floor7Y + 3, 0], size: [0.5, 6, 16] });
    elements.push({ type: 'box', pos: [0, floor7Y + 6, 0], size: [3, 0.3, 3] });
    
    // Floor 8: Sphere jumping
    const floor8Y = 32;
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2;
      const x = Math.cos(angle) * 2.5;
      const z = Math.sin(angle) * 2.5;
      elements.push({ type: 'sphere', pos: [x, floor8Y + 1 + i * 0.3, z], size: [0.6] });
    }
    elements.push({ type: 'box', pos: [0, floor8Y + 3, 0], size: [2, 0.3, 2] });
    
    // Floor 9: Mixed obstacles
    const floor9Y = 36;
    elements.push({ type: 'box', pos: [-3, floor9Y, 0], size: [0.8, 1.5, 0.8] });
    elements.push({ type: 'sphere', pos: [-1, floor9Y + 1, -2], size: [0.7] });
    elements.push({ type: 'box', pos: [1, floor9Y + 0.5, 1], size: [1, 1, 1] });
    elements.push({ type: 'cylinder', pos: [3, floor9Y + 1, -1], size: [0.4, 2, 16] });
    elements.push({ type: 'box', pos: [0, floor9Y + 2.5, 0], size: [2.5, 0.3, 2.5] });
    
    // Floor 10: Final challenge - narrow beam walk
    const floor10Y = 40;
    elements.push({ type: 'box', pos: [-4, floor10Y, 0], size: [0.5, 0.3, 0.5] });
    elements.push({ type: 'box', pos: [-2, floor10Y + 0.5, 0], size: [0.5, 0.3, 0.5] });
    elements.push({ type: 'box', pos: [0, floor10Y + 1, 0], size: [0.5, 0.3, 0.5] });
    elements.push({ type: 'box', pos: [2, floor10Y + 1.5, 0], size: [0.5, 0.3, 0.5] });
    elements.push({ type: 'box', pos: [4, floor10Y + 2, 0], size: [0.5, 0.3, 0.5] });
    // Victory platform
    elements.push({ type: 'box', pos: [0, floor10Y + 4, 0], size: [3, 0.5, 3] });
    
    return elements;
  };

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

    // Collision detection with all elements
    let onPlatform = false;
    const elements = getClimbableElements();
    
    for (const element of elements) {
      const [ex, ey, ez] = element.pos;
      
      if (newPos.y <= ey + element.size[1]/2 + 0.8 && 
          newPos.y >= ey - element.size[1]/2 - 0.2 && 
          velocity.y <= 0) {
        
        let isOnThisElement = false;
        
        if (element.type === 'box') {
          const [w, h, d] = element.size;
          isOnThisElement = Math.abs(newPos.x - ex) <= w/2 && 
                           Math.abs(newPos.z - ez) <= d/2;
        } else if (element.type === 'sphere') {
          const radius = element.size[0];
          const distance = Math.sqrt(
            (newPos.x - ex) ** 2 + (newPos.z - ez) ** 2
          );
          isOnThisElement = distance <= radius;
        } else if (element.type === 'cylinder') {
          const radius = element.size[0];
          const distance = Math.sqrt(
            (newPos.x - ex) ** 2 + (newPos.z - ez) ** 2
          );
          isOnThisElement = distance <= radius;
        }
        
        if (isOnThisElement) {
          newPos.y = ey + element.size[1]/2 + 0.8;
          newVelocity.y = 0;
          onPlatform = true;
          setIsGrounded(true);
          break;
        }
      }
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
      newPos.x + 15,
      newPos.y + 12,
      newPos.z + 15
    );
    camera.lookAt(newPos.x, newPos.y + 2, newPos.z);
  });

  return (
    <Box ref={meshRef} position={position} args={[0.8, 1.6, 0.8]}>
      <meshStandardMaterial color="#4fc3f7" emissive="#0066cc" emissiveIntensity={0.2} />
    </Box>
  );
}

// Tower component with multiple climbing elements per floor
function Tower() {
  const elements = [];
  
  // Ground
  elements.push(
    <Box key="ground" position={[0, 0, 0]} args={[12, 0.2, 12]}>
      <meshStandardMaterial color="#8b4513" />
    </Box>
  );
  
  // Floor 1: Stepping stones in a circle (Red theme)
  const floor1Y = 4;
  for (let i = 0; i < 8; i++) {
    const angle = (i / 8) * Math.PI * 2;
    const x = Math.cos(angle) * 3;
    const z = Math.sin(angle) * 3;
    elements.push(
      <Box key={`f1-${i}`} position={[x, floor1Y, z]} args={[1.2, 0.3, 1.2]}>
        <meshStandardMaterial color="#ff4444" />
      </Box>
    );
  }
  elements.push(
    <Box key="f1-center" position={[0, floor1Y + 1, 0]} args={[2, 0.3, 2]}>
      <meshStandardMaterial color="#ff6666" />
    </Box>
  );
  
  // Floor 2: Bouncing spheres and boxes (Green theme)
  const floor2Y = 8;
  elements.push(
    <Sphere key="f2-sphere1" position={[-2, floor2Y, -2]} args={[0.8]}>
      <meshStandardMaterial color="#44ff44" />
    </Sphere>
  );
  elements.push(
    <Box key="f2-box1" position={[0, floor2Y + 0.5, 0]} args={[1, 1, 1]}>
      <meshStandardMaterial color="#66ff66" />
    </Box>
  );
  elements.push(
    <Sphere key="f2-sphere2" position={[2, floor2Y + 0.3, 2]} args={[0.8]}>
      <meshStandardMaterial color="#88ff88" />
    </Sphere>
  );
  elements.push(
    <Box key="f2-box2" position={[-3, floor2Y + 1, 3]} args={[1.5, 0.3, 1.5]}>
      <meshStandardMaterial color="#44ff44" />
    </Box>
  );
  elements.push(
    <Box key="f2-box3" position={[3, floor2Y + 1.5, -1]} args={[1, 0.3, 2]}>
      <meshStandardMaterial color="#66ff66" />
    </Box>
  );
  
  // Floor 3: Ladder-like vertical elements (Blue theme)
  const floor3Y = 12;
  for (let i = 0; i < 5; i++) {
    elements.push(
      <Box key={`f3-left-${i}`} position={[-2, floor3Y + i * 0.7, 0]} args={[0.3, 0.3, 2]}>
        <meshStandardMaterial color={`hsl(240, 100%, ${60 + i * 5}%)`} />
      </Box>
    );
    elements.push(
      <Box key={`f3-right-${i}`} position={[2, floor3Y + i * 0.7, 0]} args={[0.3, 0.3, 2]}>
        <meshStandardMaterial color={`hsl(240, 100%, ${60 + i * 5}%)`} />
      </Box>
    );
  }
  elements.push(
    <Box key="f3-top" position={[0, floor3Y + 3, 0]} args={[3, 0.3, 1]}>
      <meshStandardMaterial color="#4444ff" />
    </Box>
  );
  
  // Floor 4: Spiral staircase (Purple theme)
  const floor4Y = 16;
  for (let i = 0; i < 12; i++) {
    const angle = (i / 12) * Math.PI * 2;
    const radius = 2.5;
    const x = Math.cos(angle) * radius;
    const z = Math.sin(angle) * radius;
    const y = floor4Y + (i * 0.3);
    elements.push(
      <Box key={`f4-${i}`} position={[x, y, z]} args={[0.8, 0.2, 0.8]}>
        <meshStandardMaterial color={`hsl(${280 + i * 5}, 80%, 60%)`} />
      </Box>
    );
  }
  
  // Floor 5: Floating platforms (Orange theme)
  const floor5Y = 20;
  const platforms = [
    { pos: [-3, floor5Y, -3], size: [1.5, 0.3, 1.5], type: 'box' },
    { pos: [0, floor5Y + 0.5, 0], size: [1], type: 'sphere' },
    { pos: [3, floor5Y + 1, 3], size: [1.5, 0.3, 1.5], type: 'box' },
    { pos: [-2, floor5Y + 1.5, 2], size: [1, 0.3, 1], type: 'box' },
    { pos: [1, floor5Y + 2, -2], size: [1, 0.3, 1], type: 'box' }
  ];
  platforms.forEach((platform, i) => {
    if (platform.type === 'sphere') {
      elements.push(
        <Sphere key={`f5-${i}`} position={platform.pos} args={platform.size}>
          <meshStandardMaterial color="#ff8844" />
        </Sphere>
      );
    } else {
      elements.push(
        <Box key={`f5-${i}`} position={platform.pos} args={platform.size}>
          <meshStandardMaterial color={`hsl(${30 + i * 10}, 80%, 60%)`} />
        </Box>
      );
    }
  });
  
  // Floor 6: Zigzag pattern (Cyan theme)
  const floor6Y = 24;
  const zigzagPoints = [
    [-4, 0, -4], [-2, 0.5, -2], [0, 1, 0], [2, 1.5, 2], [4, 2, 4],
    [3, 2.5, -3], [1, 3, -1], [-1, 3.5, 1], [-3, 4, 3]
  ];
  zigzagPoints.forEach(([x, yOffset, z], i) => {
    elements.push(
      <Box key={`f6-${i}`} position={[x, floor6Y + yOffset, z]} args={[1, 0.3, 1]}>
        <meshStandardMaterial color={`hsl(${180 + i * 10}, 80%, 60%)`} />
      </Box>
    );
  });
  
  // Floor 7: Column climbing (Yellow theme)
  const floor7Y = 28;
  elements.push(
    <Cylinder key="f7-col1" position={[-2, floor7Y + 1, -2]} args={[0.5, 0.5, 2]}>
      <meshStandardMaterial color="#ffff44" />
    </Cylinder>
  );
  elements.push(
    <Cylinder key="f7-col2" position={[2, floor7Y + 2, 2]} args={[0.5, 0.5, 4]}>
      <meshStandardMaterial color="#ffff66" />
    </Cylinder>
  );
  elements.push(
    <Cylinder key="f7-col3" position={[0, floor7Y + 3, 0]} args={[0.5, 0.5, 6]}>
      <meshStandardMaterial color="#ffff88" />
    </Cylinder>
  );
  elements.push(
    <Box key="f7-top" position={[0, floor7Y + 6, 0]} args={[3, 0.3, 3]}>
      <meshStandardMaterial color="#ffffaa" />
    </Box>
  );
  
  // Floor 8: Sphere jumping (Pink theme)
  const floor8Y = 32;
  for (let i = 0; i < 6; i++) {
    const angle = (i / 6) * Math.PI * 2;
    const x = Math.cos(angle) * 2.5;
    const z = Math.sin(angle) * 2.5;
    elements.push(
      <Sphere key={`f8-${i}`} position={[x, floor8Y + 1 + i * 0.3, z]} args={[0.6]}>
        <meshStandardMaterial color={`hsl(${320 + i * 10}, 80%, 70%)`} />
      </Sphere>
    );
  }
  elements.push(
    <Box key="f8-center" position={[0, floor8Y + 3, 0]} args={[2, 0.3, 2]}>
      <meshStandardMaterial color="#ff44ff" />
    </Box>
  );
  
  // Floor 9: Mixed obstacles (Multi-color)
  const floor9Y = 36;
  elements.push(
    <Box key="f9-1" position={[-3, floor9Y, 0]} args={[0.8, 1.5, 0.8]}>
      <meshStandardMaterial color="#ff6644" />
    </Box>
  );
  elements.push(
    <Sphere key="f9-2" position={[-1, floor9Y + 1, -2]} args={[0.7]}>
      <meshStandardMaterial color="#44ff66" />
    </Sphere>
  );
  elements.push(
    <Box key="f9-3" position={[1, floor9Y + 0.5, 1]} args={[1, 1, 1]}>
      <meshStandardMaterial color="#6644ff" />
    </Box>
  );
  elements.push(
    <Cylinder key="f9-4" position={[3, floor9Y + 1, -1]} args={[0.4, 0.4, 2]}>
      <meshStandardMaterial color="#ff44aa" />
    </Cylinder>
  );
  elements.push(
    <Box key="f9-top" position={[0, floor9Y + 2.5, 0]} args={[2.5, 0.3, 2.5]}>
      <meshStandardMaterial color="#44aaff" />
    </Box>
  );
  
  // Floor 10: Final challenge - narrow beam walk (Gold theme)
  const floor10Y = 40;
  const beamPositions = [
    [-4, floor10Y, 0], [-2, floor10Y + 0.5, 0], [0, floor10Y + 1, 0], 
    [2, floor10Y + 1.5, 0], [4, floor10Y + 2, 0]
  ];
  beamPositions.forEach((pos, i) => {
    elements.push(
      <Box key={`f10-${i}`} position={pos} args={[0.5, 0.3, 0.5]}>
        <meshStandardMaterial color={`hsl(${45 + i * 5}, 100%, ${70 + i * 5}%)`} />
      </Box>
    );
  });
  
  // Victory platform
  elements.push(
    <Box key="victory" position={[0, floor10Y + 4, 0]} args={[3, 0.5, 3]}>
      <meshStandardMaterial 
        color="#ffd700" 
        emissive="#332200" 
        emissiveIntensity={0.3}
      />
    </Box>
  );
  
  // Add floor labels
  for (let i = 1; i <= 10; i++) {
    elements.push(
      <Text
        key={`label-${i}`}
        position={[6, i * 4 + 2, 0]}
        fontSize={0.8}
        color="white"
        anchorX="center"
        anchorY="middle"
      >
        Floor {i}
      </Text>
    );
  }

  return <group>{elements}</group>;
}

// Victory message component
function VictoryMessage({ playerY }) {
  const isAtTop = playerY > 43; // Player reached the victory platform
  
  if (!isAtTop) return null;
  
  return (
    <Text
      position={[0, 50, 0]}
      fontSize={2}
      color="#ffd700"
      anchorX="center"
      anchorY="middle"
    >
      🎉 VICTORY! 🎉{'\n'}Master of the Hell Tower!
    </Text>
  );
}

// Game component
function Game() {
  const [playerPosition, setPlayerPosition] = useState({ x: 0, y: 1, z: 0 });

  return (
    <Canvas
      style={{ height: '100vh', background: 'linear-gradient(to top, #1a0000, #330000, #000)' }}
      camera={{ position: [15, 12, 15], fov: 60 }}
    >
      {/* Enhanced lighting */}
      <ambientLight intensity={0.4} color="#ff4400" />
      <directionalLight position={[20, 30, 10]} intensity={1} color="#ff6600" />
      <pointLight position={[0, 25, 0]} intensity={1.5} color="#ff0000" />
      <pointLight position={[0, 50, 0]} intensity={2} color="#ffd700" />

      {/* Game objects */}
      <Tower />
      <Player position={[0, 1, 0]} onPositionChange={setPlayerPosition} />
      <VictoryMessage playerY={playerPosition.y} />

      {/* Ground */}
      <Plane position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]} args={[40, 40]}>
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
  const progress = Math.min(100, (currentFloor / 10) * 100);

  return (
    <div className="game-ui">
      <div className="ui-panel">
        <h2>Hell Tower Climb</h2>
        <div className="stats">
          <div>Floor: {currentFloor}/10</div>
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
        <div>Goal: Reach the Golden Platform!</div>
        <div style={{ marginTop: '10px', fontSize: '12px', color: '#ffaa00' }}>
          Use stepping stones, spheres, ladders & more!
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