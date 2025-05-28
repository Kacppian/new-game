import React, { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Box, Cylinder, Text } from '@react-three/drei';
import * as THREE from 'three';

// Lego Block Component with studs
function LegoBlock({ position, size, material, children, onRef }) {
  const groupRef = useRef();
  const [width, height, depth] = size;
  const studSize = 0.3;
  const studHeight = 0.15;
  
  // Forward ref to parent
  React.useImperativeHandle(onRef, () => groupRef.current);
  
  // Calculate number of studs based on block size
  const studsX = Math.max(1, Math.floor(width / 2));
  const studsZ = Math.max(1, Math.floor(depth / 2));
  
  // Generate stud positions
  const generateStuds = () => {
    const studs = [];
    const spacingX = width / studsX;
    const spacingZ = depth / studsZ;
    const offsetX = -(width / 2) + (spacingX / 2);
    const offsetZ = -(depth / 2) + (spacingZ / 2);
    
    for (let i = 0; i < studsX; i++) {
      for (let j = 0; j < studsZ; j++) {
        studs.push([
          offsetX + i * spacingX,
          height / 2 + studHeight / 2,
          offsetZ + j * spacingZ
        ]);
      }
    }
    return studs;
  };

  const studPositions = generateStuds();

  return (
    <group ref={groupRef} position={position}>
      {/* Main block body */}
      <Box
        args={size}
        castShadow
        receiveShadow
      >
        {material}
      </Box>
      
      {/* Studs on top */}
      {studPositions.map((studPos, index) => (
        <Cylinder
          key={index}
          position={studPos}
          args={[studSize, studSize, studHeight, 8]}
          castShadow
        >
          {material}
        </Cylinder>
      ))}
      
      {children}
    </group>
  );
}

// Individual Obby Element Component
function ObbyElement({ element, time }) {
  const meshRef = useRef();
  
  useFrame(() => {
    if (!meshRef.current) return;
    
    // Moving platforms
    if (element.type === 'moving_platform') {
      const moveOffset = Math.sin(time * 0.8) * (element.moveRange || 3);
      if (element.moveType === 'horizontal') {
        meshRef.current.position.x = element.pos[0] + moveOffset;
      } else if (element.moveType === 'vertical') {
        meshRef.current.position.y = element.pos[1] + moveOffset;
      }
    }
    
    // Spinning obstacles
    if (element.type === 'spinner') {
      meshRef.current.rotation.y += element.spinSpeed || 0.02;
    }
    
    // Jump pads bounce animation
    if (element.type === 'jumppad') {
      const bounce = Math.abs(Math.sin(time * 3)) * 0.1;
      meshRef.current.position.y = element.pos[1] + bounce;
    }
    
    // Speed pads glow effect
    if (element.type === 'speedpad') {
      const glow = Math.sin(time * 4) * 0.3 + 0.7;
      if (meshRef.current.material) {
        meshRef.current.material.emissive = new THREE.Color(0, 0, glow);
      }
    }
  });

  const getMaterial = () => {
    switch (element.type) {
      case 'killpart':
        return (
          <meshStandardMaterial 
            color="#FF0000" 
            emissive="#220000"
            roughness={0.2}
            metalness={0.1}
          />
        );
      case 'checkpoint':
        return (
          <meshStandardMaterial 
            color="#00DD00" 
            emissive="#003300"
            transparent
            opacity={0.9}
            roughness={0.3}
            metalness={0.1}
          />
        );
      case 'jumppad':
        return (
          <meshStandardMaterial 
            color="#FFFF00" 
            emissive="#333300"
            roughness={0.2}
            metalness={0.1}
          />
        );
      case 'speedpad':
        return (
          <meshStandardMaterial 
            color="#0088FF" 
            emissive="#001133"
            roughness={0.2}
            metalness={0.1}
          />
        );
      case 'moving_platform':
        return (
          <meshStandardMaterial 
            color={element.color || "#8E44AD"} 
            roughness={0.2}
            metalness={0.05}
            emissive="#220033"
          />
        );
      case 'spinner':
        return (
          <meshStandardMaterial 
            color={element.color || "#8E44AD"} 
            emissive="#220033"
            roughness={0.15}
            metalness={0.05}
          />
        );
      default:
        if (element.material === 'spawn') {
          return (
            <meshStandardMaterial 
              color="#55DD55" 
              emissive="#002200"
              roughness={0.3}
              metalness={0.1}
            />
          );
        } else if (element.material === 'victory') {
          return (
            <meshStandardMaterial 
              color="#FFD700" 
              emissive="#333300"
              roughness={0.1}
              metalness={0.3}
            />
          );
        }
        return (
          <meshStandardMaterial 
            color={element.color || "#4A90E2"} 
            roughness={0.3}
            metalness={0.1}
          />
        );
    }
  };

  return (
    <group>
      <LegoBlock
        onRef={(ref) => { meshRef.current = ref; }}
        position={element.pos}
        size={element.size}
        material={getMaterial()}
      >
        {/* Add text labels for interactive elements */}
        {element.type === 'checkpoint' && (
          <Text
            position={[0, element.size[1] / 2 + 3, 0]}
            fontSize={0.8}
            color="white"
            anchorX="center"
            anchorY="middle"
          >
            CHECKPOINT
          </Text>
        )}
        
        {element.type === 'jumppad' && (
          <Text
            position={[0, element.size[1] / 2 + 1.5, 0]}
            fontSize={0.6}
            color="black"
            anchorX="center"
            anchorY="middle"
          >
            JUMP PAD
          </Text>
        )}
        
        {element.type === 'speedpad' && (
          <Text
            position={[0, element.size[1] / 2 + 1.5, 0]}
            fontSize={0.6}
            color="white"
            anchorX="center"
            anchorY="middle"
          >
            SPEED BOOST
          </Text>
        )}
      </LegoBlock>
    </group>
  );
}

// Main Obby Environment
function ObbyEnvironment() {
  const [time, setTime] = useState(0);
  
  useFrame((state, delta) => {
    setTime(prev => prev + delta);
  });

  // Generate all obby elements - CONNECTED SPIRAL TOWER
  const getObbyElements = () => {
    const elements = [];
    
    // Central spawn area - large safe platform
    elements.push({ 
      type: 'platform', 
      pos: [0, 0, 0], 
      size: [6, 0.5, 6], 
      color: '#90EE90',
      material: 'spawn'
    });
    
    // Welcome sign (not blocking)
    elements.push({ 
      type: 'platform', 
      pos: [0, 3, -8], 
      size: [4, 2, 0.5], 
      color: '#8B4513',
      material: 'sign'
    });
    
    // Tower parameters for spiral path
    const centerX = 0;
    const centerZ = 0;
    const baseRadius = 8;
    const totalLevels = 50;
    const heightIncrement = 0.8; // Smaller height increments for easier climbing
    const platformsPerRotation = 12; // More platforms per rotation for easier jumps
    
    // Create connected spiral path
    for (let level = 0; level < totalLevels; level++) {
      const angle = (level / platformsPerRotation) * Math.PI * 2;
      const height = 1.5 + level * heightIncrement;
      const radius = baseRadius + Math.sin(level * 0.2) * 1; // Slight radius variation
      
      const x = centerX + Math.cos(angle) * radius;
      const z = centerZ + Math.sin(angle) * radius;
      
      // Platform size and color based on difficulty
      let platformSize = [2.5, 0.5, 2.5];
      let platformColor = '#87CEEB';
      
      if (height < 10) {
        platformSize = [3, 0.5, 3];
        platformColor = '#87CEEB'; // Light blue - easy
      } else if (height < 20) {
        platformSize = [2.5, 0.5, 2.5];
        platformColor = '#FFB6C1'; // Pink - medium
      } else if (height < 30) {
        platformSize = [2, 0.5, 2];
        platformColor = '#DDA0DD'; // Plum - hard
      } else {
        platformSize = [1.8, 0.5, 1.8];
        platformColor = '#FF6347'; // Red - very hard
      }
      
      // Main spiral platform
      elements.push({
        type: 'platform',
        pos: [x, height, z],
        size: platformSize,
        color: platformColor
      });
      
      // Add varied obstacles and features
      if (level === 3) {
        // First checkpoint after a few platforms
        elements.push({
          type: 'checkpoint',
          pos: [x, height + 2, z],
          size: [1.5, 4, 0.5]
        });
      }
      
      if (level % 8 === 5) {
        // Checkpoints every 8 levels
        elements.push({
          type: 'checkpoint',
          pos: [x, height + 2, z],
          size: [1.5, 4, 0.5]
        });
      }
      
      if (level % 7 === 2 && level > 5) {
        // Jump pads for fun vertical movement
        const jumpX = centerX + Math.cos(angle + 0.3) * (radius - 2);
        const jumpZ = centerZ + Math.sin(angle + 0.3) * (radius - 2);
        elements.push({
          type: 'jumppad',
          pos: [jumpX, height, jumpZ],
          size: [1.5, 0.5, 1.5]
        });
      }
      
      if (level % 9 === 4 && level > 8) {
        // Moving platforms for dynamic challenge
        const moveX = centerX + Math.cos(angle - 0.5) * (radius + 3);
        const moveZ = centerZ + Math.sin(angle - 0.5) * (radius + 3);
        elements.push({
          type: 'moving_platform',
          pos: [moveX, height + 1, moveZ],
          size: [2, 0.5, 2],
          color: '#DDA0DD',
          moveType: 'horizontal',
          moveRange: 2
        });
      }
      
      if (level % 11 === 7 && level > 10) {
        // Speed pads for fast movement
        const speedX = centerX + Math.cos(angle + 0.8) * (radius - 1);
        const speedZ = centerZ + Math.sin(angle + 0.8) * (radius - 1);
        elements.push({
          type: 'speedpad',
          pos: [speedX, height, speedZ],
          size: [1.5, 0.5, 1.5]
        });
      }
      
      if (level % 13 === 9 && level > 15) {
        // Occasional kill parts for danger
        const killX = centerX + Math.cos(angle - 0.8) * (radius + 1);
        const killZ = centerZ + Math.sin(angle - 0.8) * (radius + 1);
        elements.push({
          type: 'killpart',
          pos: [killX, height + 0.3, killZ],
          size: [1, 0.6, 1]
        });
      }
      
      if (level % 15 === 12 && level > 18) {
        // Spinning obstacles for advanced challenge
        elements.push({
          type: 'spinner',
          pos: [x, height + 1.5, z],
          size: [4, 0.5, 0.8],
          color: '#FF6347',
          spinSpeed: 0.03
        });
      }
      
      // Add extra connecting platforms for easier jumps every few levels
      if (level % 4 === 1 && level > 0) {
        const prevAngle = ((level - 1) / platformsPerRotation) * Math.PI * 2;
        const prevX = centerX + Math.cos(prevAngle) * radius;
        const prevZ = centerZ + Math.sin(prevAngle) * radius;
        const prevHeight = 1.5 + (level - 1) * heightIncrement;
        
        // Bridge platform between spiral sections
        const bridgeX = (x + prevX) / 2;
        const bridgeZ = (z + prevZ) / 2;
        const bridgeHeight = (height + prevHeight) / 2;
        
        elements.push({
          type: 'platform',
          pos: [bridgeX, bridgeHeight, bridgeZ],
          size: [1.5, 0.5, 1.5],
          color: '#98FB98' // Light green for helper platforms
        });
      }
    }
    
    // Final victory platform at the top
    const finalHeight = 1.5 + totalLevels * heightIncrement + 3;
    elements.push({ 
      type: 'platform', 
      pos: [0, finalHeight, 0], 
      size: [6, 1, 6], 
      color: '#FFD700',
      material: 'victory'
    });
    
    // Victory sign
    elements.push({ 
      type: 'platform', 
      pos: [0, finalHeight + 4, 0], 
      size: [8, 3, 0.5], 
      color: '#8B4513',
      material: 'sign'
    });
    
    return elements;
  };

  const elements = getObbyElements();

  return (
    <group>
      {/* Render all obby elements */}
      {elements.map((element, index) => (
        <ObbyElement key={index} element={element} time={time} />
      ))}
      
      {/* Welcome text */}
      <Text
        position={[0, 6, -6]}
        fontSize={1.5}
        color="white"
        anchorX="center"
        anchorY="middle"
        maxWidth={6}
      >
        WELCOME TO{'\n'}SEOK TOWER
      </Text>
      
      {/* Victory text */}
      <Text
        position={[0, 20 + 5, 0]}
        fontSize={2}
        color="gold"
        anchorX="center"
        anchorY="middle"
        maxWidth={8}
      >
        🎉 VICTORY! 🎉{'\n'}You reached{'\n'}the top!
      </Text>
      
      {/* Atmospheric elements - Spiral around tower */}
      {Array.from({ length: 30 }, (_, i) => (
        <Box
          key={`deco-${i}`}
          position={[
            Math.cos(i * 0.8) * (15 + i * 0.3),
            5 + i * 1.2,
            Math.sin(i * 0.8) * (15 + i * 0.3)
          ]}
          args={[0.5, 0.5, 0.5]}
          castShadow
        >
          <meshStandardMaterial 
            color={`hsl(${(i * 45) % 360}, 70%, 60%)`}
            emissive={`hsl(${(i * 45) % 360}, 30%, 20%)`}
          />
        </Box>
      ))}
    </group>
  );
}

export default ObbyEnvironment;