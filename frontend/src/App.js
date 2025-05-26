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

  // Define all climbable elements for collision detection (more spacious)
  const getClimbableElements = () => {
    const elements = [];
    
    // Ground (much larger with safety margin)
    elements.push({ type: 'box', pos: [0, 0, 0], size: [30, 0.2, 30] });
    
    // Floor 1: Stepping stones in a wider circle
    const floor1Y = 8;
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const x = Math.cos(angle) * 6;
      const z = Math.sin(angle) * 6;
      elements.push({ type: 'box', pos: [x, floor1Y, z], size: [2, 0.5, 2] });
    }
    // Center platform
    elements.push({ type: 'box', pos: [0, floor1Y + 2, 0], size: [3, 0.5, 3] });
    
    // Floor 2: Bouncing spheres and boxes (more spread out)
    const floor2Y = 16;
    elements.push({ type: 'sphere', pos: [-5, floor2Y, -5], size: [1.2] });
    elements.push({ type: 'box', pos: [0, floor2Y + 1, 0], size: [2, 2, 2] });
    elements.push({ type: 'sphere', pos: [5, floor2Y + 0.5, 5], size: [1.2] });
    elements.push({ type: 'box', pos: [-6, floor2Y + 2, 6], size: [2.5, 0.5, 2.5] });
    elements.push({ type: 'box', pos: [6, floor2Y + 3, -2], size: [2, 0.5, 3] });
    
    // Floor 3: Ladder-like vertical elements (wider spacing)
    const floor3Y = 24;
    for (let i = 0; i < 6; i++) {
      elements.push({ type: 'box', pos: [-4, floor3Y + i * 1.2, 0], size: [0.5, 0.5, 3] });
      elements.push({ type: 'box', pos: [4, floor3Y + i * 1.2, 0], size: [0.5, 0.5, 3] });
    }
    elements.push({ type: 'box', pos: [0, floor3Y + 6, 0], size: [6, 0.5, 2] });
    
    // Floor 4: Spiral staircase (larger spiral)
    const floor4Y = 32;
    for (let i = 0; i < 16; i++) {
      const angle = (i / 16) * Math.PI * 2;
      const radius = 5;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      const y = floor4Y + (i * 0.5);
      elements.push({ type: 'box', pos: [x, y, z], size: [1.5, 0.3, 1.5] });
    }
    
    // Floor 5: Floating platforms (more spacious)
    const floor5Y = 40;
    elements.push({ type: 'box', pos: [-6, floor5Y, -6], size: [2.5, 0.5, 2.5] });
    elements.push({ type: 'sphere', pos: [0, floor5Y + 1, 0], size: [1.5] });
    elements.push({ type: 'box', pos: [6, floor5Y + 2, 6], size: [2.5, 0.5, 2.5] });
    elements.push({ type: 'box', pos: [-4, floor5Y + 3, 4], size: [2, 0.5, 2] });
    elements.push({ type: 'box', pos: [2, floor5Y + 4, -4], size: [2, 0.5, 2] });
    
    // Floor 6: Zigzag pattern (wider zigzag)
    const floor6Y = 48;
    const zigzagPoints = [
      [-8, 0, -8], [-4, 1, -4], [0, 2, 0], [4, 3, 4], [8, 4, 8],
      [6, 5, -6], [2, 6, -2], [-2, 7, 2], [-6, 8, 6]
    ];
    zigzagPoints.forEach(([x, yOffset, z]) => {
      elements.push({ type: 'box', pos: [x, floor6Y + yOffset, z], size: [2, 0.5, 2] });
    });
    
    // Floor 7: Column climbing (taller columns)
    const floor7Y = 56;
    elements.push({ type: 'cylinder', pos: [-4, floor7Y + 2, -4], size: [0.8, 4, 16] });
    elements.push({ type: 'cylinder', pos: [4, floor7Y + 4, 4], size: [0.8, 8, 16] });
    elements.push({ type: 'cylinder', pos: [0, floor7Y + 6, 0], size: [0.8, 12, 16] });
    elements.push({ type: 'box', pos: [0, floor7Y + 12, 0], size: [5, 0.5, 5] });
    
    // Floor 8: Sphere jumping (larger pattern)
    const floor8Y = 64;
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const x = Math.cos(angle) * 5;
      const z = Math.sin(angle) * 5;
      elements.push({ type: 'sphere', pos: [x, floor8Y + 2 + i * 0.5, z], size: [1] });
    }
    elements.push({ type: 'box', pos: [0, floor8Y + 6, 0], size: [3, 0.5, 3] });
    
    // Floor 9: Mixed obstacles (more spacious)
    const floor9Y = 72;
    elements.push({ type: 'box', pos: [-6, floor9Y, 0], size: [1.5, 3, 1.5] });
    elements.push({ type: 'sphere', pos: [-2, floor9Y + 2, -4], size: [1.2] });
    elements.push({ type: 'box', pos: [2, floor9Y + 1, 2], size: [2, 2, 2] });
    elements.push({ type: 'cylinder', pos: [6, floor9Y + 2, -2], size: [0.8, 4, 16] });
    elements.push({ type: 'box', pos: [0, floor9Y + 5, 0], size: [4, 0.5, 4] });
    
    // Floor 10: Final challenge - wider beam walk
    const floor10Y = 80;
    elements.push({ type: 'box', pos: [-8, floor10Y, 0], size: [1, 0.5, 1] });
    elements.push({ type: 'box', pos: [-4, floor10Y + 1, 0], size: [1, 0.5, 1] });
    elements.push({ type: 'box', pos: [0, floor10Y + 2, 0], size: [1, 0.5, 1] });
    elements.push({ type: 'box', pos: [4, floor10Y + 3, 0], size: [1, 0.5, 1] });
    elements.push({ type: 'box', pos: [8, floor10Y + 4, 0], size: [1, 0.5, 1] });
    // Victory platform
    elements.push({ type: 'box', pos: [0, floor10Y + 8, 0], size: [5, 1, 5] });
    
    return elements;
  };

  // Safe respawn function
  const respawnPlayer = () => {
    if (meshRef.current) {
      meshRef.current.position.set(0, 2, 0);
      setVelocity({ x: 0, y: 0, z: 0 });
      setIsGrounded(true);
    }
  };

  // Physics and movement
  useFrame((state, delta) => {
    if (!meshRef.current) return;

    const moveSpeed = 15; // Increased movement speed
    const jumpForce = 20; // Increased jump force
    const gravity = -30;

    // Get current position
    const currentPos = meshRef.current.position;
    
    // Apply gravity
    let newVelocity = { ...velocity };
    newVelocity.y += gravity * delta;

    // Handle movement with better responsiveness
    if (keys['KeyA'] || keys['ArrowLeft']) {
      newVelocity.x = -moveSpeed;
    } else if (keys['KeyD'] || keys['ArrowRight']) {
      newVelocity.x = moveSpeed;
    } else {
      newVelocity.x *= 0.85; // Less friction for better control
    }

    if (keys['KeyW'] || keys['ArrowUp']) {
      newVelocity.z = -moveSpeed;
    } else if (keys['KeyS'] || keys['ArrowDown']) {
      newVelocity.z = moveSpeed;
    } else {
      newVelocity.z *= 0.85; // Less friction for better control
    }

    // Jumping with better force
    if (keys['Space'] && isGrounded) {
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
          newPos.y >= ey - element.size[1]/2 - 0.5 && 
          velocity.y <= 0.1) { // More forgiving landing detection
        
        let isOnThisElement = false;
        
        if (element.type === 'box') {
          const [w, h, d] = element.size;
          isOnThisElement = Math.abs(newPos.x - ex) <= w/2 + 0.2 && // Slightly more forgiving collision
                           Math.abs(newPos.z - ez) <= d/2 + 0.2;
        } else if (element.type === 'sphere') {
          const radius = element.size[0];
          const distance = Math.sqrt(
            (newPos.x - ex) ** 2 + (newPos.z - ez) ** 2
          );
          isOnThisElement = distance <= radius + 0.3; // More forgiving sphere collision
        } else if (element.type === 'cylinder') {
          const radius = element.size[0];
          const distance = Math.sqrt(
            (newPos.x - ex) ** 2 + (newPos.z - ez) ** 2
          );
          isOnThisElement = distance <= radius + 0.3; // More forgiving cylinder collision
        }
        
        if (isOnThisElement) {
          newPos.y = ey + element.size[1]/2 + 0.8;
          newVelocity.y = Math.max(0, newVelocity.y); // Don't reset upward velocity
          onPlatform = true;
          setIsGrounded(true);
          break;
        }
      }
    }

    if (!onPlatform && newVelocity.y <= 0) {
      setIsGrounded(false);
    }

    // World boundaries - prevent falling off the world
    const worldBoundary = 12; // Keep player within ground area
    if (Math.abs(newPos.x) > worldBoundary || Math.abs(newPos.z) > worldBoundary) {
      // If player tries to go outside bounds, push them back
      if (Math.abs(newPos.x) > worldBoundary) {
        newPos.x = Math.sign(newPos.x) * worldBoundary;
        newVelocity.x = 0;
      }
      if (Math.abs(newPos.z) > worldBoundary) {
        newPos.z = Math.sign(newPos.z) * worldBoundary;
        newVelocity.z = 0;
      }
    }

    // Safety respawn if player falls too far or gets stuck
    if (newPos.y < -5) {
      console.log("Player fell too far, respawning...");
      respawnPlayer();
      return;
    }

    // Update player position
    meshRef.current.position.set(newPos.x, newPos.y, newPos.z);
    setVelocity(newVelocity);
    
    if (onPositionChange) {
      onPositionChange(newPos);
    }

    // ANGLED TOP-DOWN CAMERA SYSTEM (Isometric-style)
    const cameraDistance = 20;
    const cameraHeight = 15;
    
    // Position camera at an angle that shows both tops and sides
    // 45-degree angle from the back-right
    camera.position.set(
      newPos.x + cameraDistance * 0.7,     // Offset to the right
      newPos.y + cameraHeight,             // Height above player
      newPos.z + cameraDistance * 0.7      // Offset to the back
    );
    
    // Look at a point slightly ahead of the player for better view
    camera.lookAt(newPos.x, newPos.y + 2, newPos.z);
  });

  return (
    <Box ref={meshRef} position={position} args={[0.8, 1.6, 0.8]}>
      <meshStandardMaterial color="#4fc3f7" emissive="#0066cc" emissiveIntensity={0.3} />
    </Box>
  );
}

// Isometric grid helper
function IsometricGridHelper() {
  return (
    <group>
      {/* Grid lines optimized for angled view */}
      {Array.from({ length: 25 }, (_, i) => {
        const pos = (i - 12) * 2;
        return (
          <group key={i}>
            {/* Vertical lines */}
            <Box position={[pos, 0.01, 0]} args={[0.03, 0.02, 24]}>
              <meshStandardMaterial color="#555555" transparent opacity={0.3} />
            </Box>
            {/* Horizontal lines */}
            <Box position={[0, 0.01, pos]} args={[24, 0.02, 0.03]}>
              <meshStandardMaterial color="#555555" transparent opacity={0.3} />
            </Box>
          </group>
        );
      })}
      
      {/* Center crosshair */}
      <Box position={[0, 0.02, 0]} args={[3, 0.04, 0.1]}>
        <meshStandardMaterial color="#ff0000" transparent opacity={0.5} />
      </Box>
      <Box position={[0, 0.02, 0]} args={[0.1, 0.04, 3]}>
        <meshStandardMaterial color="#ff0000" transparent opacity={0.5} />
      </Box>
    </group>
  );
}

// Dynamic background component
function DynamicBackground({ playerY }) {
  const { scene } = useThree();
  
  useEffect(() => {
    // Define color zones based on height
    let topColor, bottomColor;
    
    if (playerY < 20) {
      // White zone (ground to floor 2)
      topColor = new THREE.Color('#ffffff');
      bottomColor = new THREE.Color('#f0f0f0');
    } else if (playerY < 40) {
      // Blue zone (floors 3-5)
      topColor = new THREE.Color('#87ceeb');
      bottomColor = new THREE.Color('#4682b4');
    } else if (playerY < 60) {
      // Red zone (floors 6-7)
      topColor = new THREE.Color('#ff6b6b');
      bottomColor = new THREE.Color('#dc143c');
    } else if (playerY < 80) {
      // Green zone (floors 8-9)
      topColor = new THREE.Color('#90ee90');
      bottomColor = new THREE.Color('#228b22');
    } else {
      // White zone again (final floors)
      topColor = new THREE.Color('#ffffff');
      bottomColor = new THREE.Color('#f8f8ff');
    }
    
    // Create gradient background
    scene.background = new THREE.Color().lerpColors(bottomColor, topColor, 0.5);
  }, [playerY, scene]);
  
  return null;
}

// Invisible boundaries to keep player safe
function SafetyBoundaries() {
  const boundaryHeight = 200;
  const boundarySize = 15;
  
  return (
    <group>
      {/* Invisible walls around the play area */}
      <Box position={[boundarySize, boundaryHeight/2, 0]} args={[1, boundaryHeight, boundarySize * 2]} visible={false}>
        <meshStandardMaterial transparent opacity={0} />
      </Box>
      <Box position={[-boundarySize, boundaryHeight/2, 0]} args={[1, boundaryHeight, boundarySize * 2]} visible={false}>
        <meshStandardMaterial transparent opacity={0} />
      </Box>
      <Box position={[0, boundaryHeight/2, boundarySize]} args={[boundarySize * 2, boundaryHeight, 1]} visible={false}>
        <meshStandardMaterial transparent opacity={0} />
      </Box>
      <Box position={[0, boundaryHeight/2, -boundarySize]} args={[boundarySize * 2, boundaryHeight, 1]} visible={false}>
        <meshStandardMaterial transparent opacity={0} />
      </Box>
    </group>
  );
}

// Tower component optimized for isometric view
function Tower() {
  const elements = [];
  
  // Ground (much larger with visible boundaries)
  elements.push(
    <Box key="ground" position={[0, 0, 0]} args={[30, 0.2, 30]} receiveShadow>
      <meshStandardMaterial color="#8b4513" />
    </Box>
  );
  
  // Add visible boundary markers
  for (let i = -12; i <= 12; i += 6) {
    elements.push(
      <Box key={`boundary-x-${i}`} position={[i, 1, 12]} args={[0.3, 2, 0.3]} castShadow>
        <meshStandardMaterial color="#654321" />
      </Box>
    );
    elements.push(
      <Box key={`boundary-x-neg-${i}`} position={[i, 1, -12]} args={[0.3, 2, 0.3]} castShadow>
        <meshStandardMaterial color="#654321" />
      </Box>
    );
    elements.push(
      <Box key={`boundary-z-${i}`} position={[12, 1, i]} args={[0.3, 2, 0.3]} castShadow>
        <meshStandardMaterial color="#654321" />
      </Box>
    );
    elements.push(
      <Box key={`boundary-z-neg-${i}`} position={[-12, 1, i]} args={[0.3, 2, 0.3]} castShadow>
        <meshStandardMaterial color="#654321" />
      </Box>
    );
  }
  
  // Floor 1: Stepping stones in a wider circle (White zone)
  const floor1Y = 8;
  for (let i = 0; i < 8; i++) {
    const angle = (i / 8) * Math.PI * 2;
    const x = Math.cos(angle) * 6;
    const z = Math.sin(angle) * 6;
    elements.push(
      <Box key={`f1-${i}`} position={[x, floor1Y, z]} args={[2, 0.5, 2]} castShadow receiveShadow>
        <meshStandardMaterial color="#e6e6e6" />
      </Box>
    );
  }
  elements.push(
    <Box key="f1-center" position={[0, floor1Y + 2, 0]} args={[3, 0.5, 3]} castShadow receiveShadow>
      <meshStandardMaterial color="#f0f0f0" />
    </Box>
  );
  
  // Floor 2: Bouncing spheres and boxes (White zone - more spread out)
  const floor2Y = 16;
  elements.push(
    <Sphere key="f2-sphere1" position={[-5, floor2Y, -5]} args={[1.2]} castShadow receiveShadow>
      <meshStandardMaterial color="#f5f5f5" />
    </Sphere>
  );
  elements.push(
    <Box key="f2-box1" position={[0, floor2Y + 1, 0]} args={[2, 2, 2]} castShadow receiveShadow>
      <meshStandardMaterial color="#ffffff" />
    </Box>
  );
  elements.push(
    <Sphere key="f2-sphere2" position={[5, floor2Y + 0.5, 5]} args={[1.2]} castShadow receiveShadow>
      <meshStandardMaterial color="#f8f8f8" />
    </Sphere>
  );
  elements.push(
    <Box key="f2-box2" position={[-6, floor2Y + 2, 6]} args={[2.5, 0.5, 2.5]} castShadow receiveShadow>
      <meshStandardMaterial color="#e0e0e0" />
    </Box>
  );
  elements.push(
    <Box key="f2-box3" position={[6, floor2Y + 3, -2]} args={[2, 0.5, 3]} castShadow receiveShadow>
      <meshStandardMaterial color="#f0f0f0" />
    </Box>
  );
  
  // Floor 3: Ladder-like vertical elements (Blue zone)
  const floor3Y = 24;
  for (let i = 0; i < 6; i++) {
    elements.push(
      <Box key={`f3-left-${i}`} position={[-4, floor3Y + i * 1.2, 0]} args={[0.5, 0.5, 3]} castShadow receiveShadow>
        <meshStandardMaterial color={`hsl(240, 100%, ${70 + i * 3}%)`} />
      </Box>
    );
    elements.push(
      <Box key={`f3-right-${i}`} position={[4, floor3Y + i * 1.2, 0]} args={[0.5, 0.5, 3]} castShadow receiveShadow>
        <meshStandardMaterial color={`hsl(240, 100%, ${70 + i * 3}%)`} />
      </Box>
    );
  }
  elements.push(
    <Box key="f3-top" position={[0, floor3Y + 6, 0]} args={[6, 0.5, 2]} castShadow receiveShadow>
      <meshStandardMaterial color="#4682b4" />
    </Box>
  );
  
  // Floor 4: Spiral staircase (Blue zone - larger spiral)
  const floor4Y = 32;
  for (let i = 0; i < 16; i++) {
    const angle = (i / 16) * Math.PI * 2;
    const radius = 5;
    const x = Math.cos(angle) * radius;
    const z = Math.sin(angle) * radius;
    const y = floor4Y + (i * 0.5);
    elements.push(
      <Box key={`f4-${i}`} position={[x, y, z]} args={[1.5, 0.3, 1.5]} castShadow receiveShadow>
        <meshStandardMaterial color={`hsl(${220 + i * 3}, 80%, 65%)`} />
      </Box>
    );
  }
  
  // Floor 5: Floating platforms (Red zone)
  const floor5Y = 40;
  const platforms = [
    { pos: [-6, floor5Y, -6], size: [2.5, 0.5, 2.5], type: 'box' },
    { pos: [0, floor5Y + 1, 0], size: [1.5], type: 'sphere' },
    { pos: [6, floor5Y + 2, 6], size: [2.5, 0.5, 2.5], type: 'box' },
    { pos: [-4, floor5Y + 3, 4], size: [2, 0.5, 2], type: 'box' },
    { pos: [2, floor5Y + 4, -4], size: [2, 0.5, 2], type: 'box' }
  ];
  platforms.forEach((platform, i) => {
    if (platform.type === 'sphere') {
      elements.push(
        <Sphere key={`f5-${i}`} position={platform.pos} args={platform.size} castShadow receiveShadow>
          <meshStandardMaterial color="#ff6b6b" />
        </Sphere>
      );
    } else {
      elements.push(
        <Box key={`f5-${i}`} position={platform.pos} args={platform.size} castShadow receiveShadow>
          <meshStandardMaterial color={`hsl(${0 + i * 10}, 80%, 65%)`} />
        </Box>
      );
    }
  });
  
  // Floor 6: Zigzag pattern (Red zone - wider)
  const floor6Y = 48;
  const zigzagPoints = [
    [-8, 0, -8], [-4, 1, -4], [0, 2, 0], [4, 3, 4], [8, 4, 8],
    [6, 5, -6], [2, 6, -2], [-2, 7, 2], [-6, 8, 6]
  ];
  zigzagPoints.forEach(([x, yOffset, z], i) => {
    elements.push(
      <Box key={`f6-${i}`} position={[x, floor6Y + yOffset, z]} args={[2, 0.5, 2]} castShadow receiveShadow>
        <meshStandardMaterial color={`hsl(${350 + i * 5}, 80%, 60%)`} />
      </Box>
    );
  });
  
  // Floor 7: Column climbing (Red zone)
  const floor7Y = 56;
  elements.push(
    <Cylinder key="f7-col1" position={[-4, floor7Y + 2, -4]} args={[0.8, 0.8, 4]} castShadow receiveShadow>
      <meshStandardMaterial color="#dc143c" />
    </Cylinder>
  );
  elements.push(
    <Cylinder key="f7-col2" position={[4, floor7Y + 4, 4]} args={[0.8, 0.8, 8]} castShadow receiveShadow>
      <meshStandardMaterial color="#b22222" />
    </Cylinder>
  );
  elements.push(
    <Cylinder key="f7-col3" position={[0, floor7Y + 6, 0]} args={[0.8, 0.8, 12]} castShadow receiveShadow>
      <meshStandardMaterial color="#8b0000" />
    </Cylinder>
  );
  elements.push(
    <Box key="f7-top" position={[0, floor7Y + 12, 0]} args={[5, 0.5, 5]} castShadow receiveShadow>
      <meshStandardMaterial color="#ff4500" />
    </Box>
  );
  
  // Floor 8: Sphere jumping (Green zone)
  const floor8Y = 64;
  for (let i = 0; i < 8; i++) {
    const angle = (i / 8) * Math.PI * 2;
    const x = Math.cos(angle) * 5;
    const z = Math.sin(angle) * 5;
    elements.push(
      <Sphere key={`f8-${i}`} position={[x, floor8Y + 2 + i * 0.5, z]} args={[1]} castShadow receiveShadow>
        <meshStandardMaterial color={`hsl(${120 + i * 8}, 80%, 65%)`} />
      </Sphere>
    );
  }
  elements.push(
    <Box key="f8-center" position={[0, floor8Y + 6, 0]} args={[3, 0.5, 3]} castShadow receiveShadow>
      <meshStandardMaterial color="#228b22" />
    </Box>
  );
  
  // Floor 9: Mixed obstacles (Green zone)
  const floor9Y = 72;
  elements.push(
    <Box key="f9-1" position={[-6, floor9Y, 0]} args={[1.5, 3, 1.5]} castShadow receiveShadow>
      <meshStandardMaterial color="#32cd32" />
    </Box>
  );
  elements.push(
    <Sphere key="f9-2" position={[-2, floor9Y + 2, -4]} args={[1.2]} castShadow receiveShadow>
      <meshStandardMaterial color="#90ee90" />
    </Sphere>
  );
  elements.push(
    <Box key="f9-3" position={[2, floor9Y + 1, 2]} args={[2, 2, 2]} castShadow receiveShadow>
      <meshStandardMaterial color="#00ff00" />
    </Box>
  );
  elements.push(
    <Cylinder key="f9-4" position={[6, floor9Y + 2, -2]} args={[0.8, 0.8, 4]} castShadow receiveShadow>
      <meshStandardMaterial color="#006400" />
    </Cylinder>
  );
  elements.push(
    <Box key="f9-top" position={[0, floor9Y + 5, 0]} args={[4, 0.5, 4]} castShadow receiveShadow>
      <meshStandardMaterial color="#adff2f" />
    </Box>
  );
  
  // Floor 10: Final challenge (White zone again)
  const floor10Y = 80;
  const beamPositions = [
    [-8, floor10Y, 0], [-4, floor10Y + 1, 0], [0, floor10Y + 2, 0], 
    [4, floor10Y + 3, 0], [8, floor10Y + 4, 0]
  ];
  beamPositions.forEach((pos, i) => {
    elements.push(
      <Box key={`f10-${i}`} position={pos} args={[1, 0.5, 1]} castShadow receiveShadow>
        <meshStandardMaterial color={`hsl(${0}, 0%, ${90 - i * 5}%)`} />
      </Box>
    );
  });
  
  // Victory platform (Golden white)
  elements.push(
    <Box key="victory" position={[0, floor10Y + 8, 0]} args={[5, 1, 5]} castShadow receiveShadow>
      <meshStandardMaterial 
        color="#fffacd" 
        emissive="#ffd700" 
        emissiveIntensity={0.2}
      />
    </Box>
  );
  
  // Add floor labels positioned for isometric view
  for (let i = 1; i <= 10; i++) {
    elements.push(
      <Text
        key={`label-${i}`}
        position={[14, i * 8 + 1, 0]}
        fontSize={1.2}
        color="#000000"
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
  const isAtTop = playerY > 85; // Player reached the victory platform
  
  if (!isAtTop) return null;
  
  return (
    <Text
      position={[0, 95, 0]}
      fontSize={3}
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
      style={{ height: '100vh' }}
      camera={{ position: [15, 15, 15], fov: 60 }} // Initial isometric position
      shadows // Enable shadows for better depth perception
    >
      {/* Dynamic background based on player height */}
      <DynamicBackground playerY={playerPosition.y} />
      
      {/* Enhanced lighting optimized for isometric view */}
      <ambientLight intensity={0.4} color="#ffffff" />
      <directionalLight 
        position={[30, 50, 30]} 
        intensity={1.2} 
        color="#ffffff" 
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-far={200}
        shadow-camera-left={-30}
        shadow-camera-right={30}
        shadow-camera-top={30}
        shadow-camera-bottom={-30}
      />
      <pointLight position={[0, 40, 0]} intensity={0.6} color="#ffffff" />

      {/* Visual aids optimized for isometric view */}
      <IsometricGridHelper />
      
      {/* Safety boundaries */}
      <SafetyBoundaries />

      {/* Game objects */}
      <Tower />
      <Player position={[0, 1, 0]} onPositionChange={setPlayerPosition} />
      <VictoryMessage playerY={playerPosition.y} />

      {/* Much larger ground with shadows */}
      <Plane position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]} args={[60, 60]} receiveShadow>
        <meshStandardMaterial color="#8b7355" />
      </Plane>

      {/* Disabled orbit controls */}
      <OrbitControls enabled={false} />
    </Canvas>
  );
}

// UI Component
function GameUI({ playerY }) {
  const currentFloor = Math.max(0, Math.floor(playerY / 8));
  const progress = Math.min(100, (currentFloor / 10) * 100);
  
  // Determine current zone
  let zone = "White";
  if (playerY >= 20 && playerY < 40) zone = "Blue";
  else if (playerY >= 40 && playerY < 60) zone = "Red";
  else if (playerY >= 60 && playerY < 80) zone = "Green";
  else if (playerY >= 80) zone = "White Heaven";

  return (
    <div className="game-ui">
      <div className="ui-panel">
        <h2>Hell Tower Climb</h2>
        <div className="stats">
          <div>Floor: {currentFloor}/10</div>
          <div>Height: {Math.round(playerY)}m</div>
          <div>Zone: {zone}</div>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${progress}%` }}></div>
          </div>
          <div>{Math.round(progress)}% Complete</div>
        </div>
      </div>
      
      <div className="controls-panel">
        <h3>Controls:</h3>
        <div>WASD / Arrow Keys - Move</div>
        <div>SPACE - Jump</div>
        <div>Goal: Reach the Golden Platform!</div>
        <div style={{ marginTop: '10px', fontSize: '12px', color: '#666' }}>
          Isometric view: See heights and depths clearly!
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