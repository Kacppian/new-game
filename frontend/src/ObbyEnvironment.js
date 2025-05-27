import React, { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Box, Cylinder, Text } from '@react-three/drei';
import * as THREE from 'three';

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
            color="#FF4444" 
            emissive="#330000"
            roughness={0.3}
            metalness={0.7}
          />
        );
      case 'checkpoint':
        return (
          <meshStandardMaterial 
            color="#00FF00" 
            emissive="#003300"
            transparent
            opacity={0.8}
            roughness={0.2}
          />
        );
      case 'jumppad':
        return (
          <meshStandardMaterial 
            color="#FFFF00" 
            emissive="#444400"
            roughness={0.1}
            metalness={0.5}
          />
        );
      case 'speedpad':
        return (
          <meshStandardMaterial 
            color="#0088FF" 
            emissive="#001144"
            roughness={0.1}
            metalness={0.3}
          />
        );
      case 'moving_platform':
        return (
          <meshStandardMaterial 
            color={element.color || "#DDA0DD"} 
            roughness={0.3}
            metalness={0.4}
          />
        );
      case 'spinner':
        return (
          <meshStandardMaterial 
            color={element.color || "#FF6347"} 
            emissive="#220000"
            roughness={0.2}
            metalness={0.6}
          />
        );
      default:
        if (element.material === 'spawn') {
          return (
            <meshStandardMaterial 
              color="#90EE90" 
              emissive="#002200"
              roughness={0.4}
            />
          );
        } else if (element.material === 'victory') {
          return (
            <meshStandardMaterial 
              color="#FFD700" 
              emissive="#444400"
              roughness={0.1}
              metalness={0.8}
            />
          );
        }
        return (
          <meshStandardMaterial 
            color={element.color || "#87CEEB"} 
            roughness={0.4}
            metalness={0.2}
          />
        );
    }
  };

  return (
    <group>
      <Box
        ref={meshRef}
        position={element.pos}
        args={element.size}
        castShadow
        receiveShadow
      >
        {getMaterial()}
      </Box>
      
      {/* Add text labels for interactive elements */}
      {element.type === 'checkpoint' && (
        <Text
          position={[element.pos[0], element.pos[1] + 3, element.pos[2]]}
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
          position={[element.pos[0], element.pos[1] + 1.5, element.pos[2]]}
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
          position={[element.pos[0], element.pos[1] + 1.5, element.pos[2]]}
          fontSize={0.6}
          color="white"
          anchorX="center"
          anchorY="middle"
        >
          SPEED BOOST
        </Text>
      )}
    </group>
  );
}

// Main Obby Environment
function ObbyEnvironment() {
  const [time, setTime] = useState(0);
  
  useFrame((state, delta) => {
    setTime(prev => prev + delta);
  });

  // Generate all obby elements
  const getObbyElements = () => {
    const elements = [];
    
    // Spawn area - large safe platform
    elements.push({ 
      type: 'platform', 
      pos: [0, 0, 0], 
      size: [12, 0.5, 12], 
      color: '#90EE90',
      material: 'spawn'
    });
    
    // Welcome sign
    elements.push({ 
      type: 'platform', 
      pos: [0, 3, -8], 
      size: [8, 4, 0.5], 
      color: '#8B4513',
      material: 'sign'
    });
    
    // Checkpoint 1: Simple jumps
    elements.push({ type: 'checkpoint', pos: [0, 1, 8], size: [2, 4, 0.5] });
    elements.push({ type: 'platform', pos: [0, 2, 12], size: [3, 0.5, 3], color: '#87CEEB' });
    elements.push({ type: 'platform', pos: [4, 3, 16], size: [2, 0.5, 2], color: '#87CEEB' });
    elements.push({ type: 'platform', pos: [-4, 4, 20], size: [2, 0.5, 2], color: '#87CEEB' });
    
    // Stage 1: Basic parkour (floors 1-2)
    for (let i = 0; i < 6; i++) {
      const x = (i % 2 === 0) ? -3 : 3;
      const z = 24 + i * 4;
      const y = 5 + i * 0.5;
      elements.push({ 
        type: 'platform', 
        pos: [x, y, z], 
        size: [2, 0.5, 2], 
        color: '#FFB6C1' 
      });
    }
    
    // Checkpoint 2: After basic jumps
    elements.push({ type: 'checkpoint', pos: [0, 8, 48], size: [2, 4, 0.5] });
    
    // Stage 2: Kill parts and precision (floors 3-4)
    elements.push({ type: 'platform', pos: [0, 9, 52], size: [4, 0.5, 4], color: '#90EE90' });
    
    // Kill parts maze - more challenging
    for (let i = 0; i < 8; i++) {
      const x = -6 + i * 1.5;
      elements.push({ type: 'killpart', pos: [x, 9.3, 56], size: [1, 0.6, 1] });
      elements.push({ type: 'platform', pos: [x, 9, 58], size: [1, 0.5, 1], color: '#87CEEB' });
      
      // Add some safe platforms between kill parts
      if (i % 2 === 1) {
        elements.push({ type: 'platform', pos: [x - 0.7, 9, 57], size: [0.8, 0.5, 0.8], color: '#90EE90' });
      }
    }
    
    // Stage 3: Moving platforms (floors 5-6)
    elements.push({ type: 'checkpoint', pos: [0, 10, 64], size: [2, 4, 0.5] });
    for (let i = 0; i < 5; i++) {
      elements.push({ 
        type: 'moving_platform', 
        pos: [-8 + i * 4, 12 + i, 68 + i * 4], 
        size: [2, 0.5, 2], 
        color: '#DDA0DD',
        moveType: 'horizontal',
        moveRange: 4
      });
    }
    
    // Stage 4: Jump pads and speed (floors 7-8)
    elements.push({ type: 'checkpoint', pos: [0, 18, 88], size: [2, 4, 0.5] });
    elements.push({ type: 'jumppad', pos: [0, 19, 92], size: [2, 0.5, 2] });
    elements.push({ type: 'platform', pos: [0, 25, 96], size: [3, 0.5, 3], color: '#90EE90' });
    
    // Speed pads section
    for (let i = 0; i < 4; i++) {
      elements.push({ type: 'speedpad', pos: [0, 26, 100 + i * 3], size: [2, 0.5, 2] });
      // Add platforms between speed pads
      if (i < 3) {
        elements.push({ type: 'platform', pos: [0, 27, 101.5 + i * 3], size: [1.5, 0.5, 1.5], color: '#87CEEB' });
      }
    }
    
    // Stage 5: Spinning obstacles (floors 9-10)
    elements.push({ type: 'checkpoint', pos: [0, 28, 116], size: [2, 4, 0.5] });
    for (let i = 0; i < 3; i++) {
      elements.push({ 
        type: 'spinner', 
        pos: [0, 30 + i * 3, 120 + i * 6], 
        size: [8, 0.5, 1], 
        color: '#FF6347',
        spinSpeed: 0.02 + i * 0.01
      });
      elements.push({ 
        type: 'platform', 
        pos: [0, 30 + i * 3, 124 + i * 6], 
        size: [2, 0.5, 2], 
        color: '#90EE90' 
      });
    }
    
    // Final challenge: Mixed obstacles
    elements.push({ type: 'checkpoint', pos: [0, 36, 136], size: [2, 4, 0.5] });
    
    // Final platform - Victory!
    elements.push({ 
      type: 'platform', 
      pos: [0, 40, 140], 
      size: [6, 1, 6], 
      color: '#FFD700',
      material: 'victory'
    });
    
    // Victory sign
    elements.push({ 
      type: 'platform', 
      pos: [0, 45, 140], 
      size: [8, 4, 0.5], 
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
        position={[0, 6, -8]}
        fontSize={1.5}
        color="white"
        anchorX="center"
        anchorY="middle"
        maxWidth={6}
      >
        WELCOME TO{'\n'}ROBLOX OBBY{'\n'}TOWER CLIMB!
      </Text>
      
      {/* Victory text */}
      <Text
        position={[0, 48, 140]}
        fontSize={2}
        color="gold"
        anchorX="center"
        anchorY="middle"
        maxWidth={8}
      >
        🎉 VICTORY! 🎉{'\n'}You completed{'\n'}the obby!
      </Text>
      
      {/* Atmospheric elements */}
      {/* Add some floating decorative elements */}
      {Array.from({ length: 20 }, (_, i) => (
        <Box
          key={`deco-${i}`}
          position={[
            Math.sin(i * 2) * 20,
            10 + Math.cos(i * 3) * 15,
            i * 8 - 10
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