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

  // Generate all obby elements - TOWER STRUCTURE
  const getObbyElements = () => {
    const elements = [];
    
    // Central spawn area - large safe platform
    elements.push({ 
      type: 'platform', 
      pos: [0, 0, 0], 
      size: [8, 0.5, 8], 
      color: '#90EE90',
      material: 'spawn'
    });
    
    // Welcome sign
    elements.push({ 
      type: 'platform', 
      pos: [0, 3, -6], 
      size: [6, 3, 0.5], 
      color: '#8B4513',
      material: 'sign'
    });
    
    // Tower parameters
    const centerX = 0;
    const centerZ = 0;
    const towerRadius = 12;
    const levelsPerFloor = 8; // Platforms per level around the tower
    const heightPerLevel = 3;
    const totalLevels = 40; // Total climbing platforms
    
    // Generate spiral tower platforms
    for (let level = 0; level < totalLevels; level++) {
      const angle = (level / levelsPerFloor) * Math.PI * 2;
      const height = 2 + level * (heightPerLevel / levelsPerFloor);
      const radius = towerRadius + Math.sin(level * 0.3) * 2; // Varying radius for difficulty
      
      const x = centerX + Math.cos(angle) * radius;
      const z = centerZ + Math.sin(angle) * radius;
      
      // Determine platform type and difficulty based on height
      let platformColor = '#87CEEB';
      let platformSize = [3, 0.5, 3];
      
      if (height < 8) {
        // Lower levels - easy
        platformColor = '#87CEEB';
        platformSize = [3, 0.5, 3];
      } else if (height < 16) {
        // Mid levels - medium
        platformColor = '#FFB6C1';
        platformSize = [2.5, 0.5, 2.5];
      } else if (height < 24) {
        // Higher levels - hard
        platformColor = '#DDA0DD';
        platformSize = [2, 0.5, 2];
      } else {
        // Top levels - very hard
        platformColor = '#FF6347';
        platformSize = [1.5, 0.5, 1.5];
      }
      
      elements.push({
        type: 'platform',
        pos: [x, height, z],
        size: platformSize,
        color: platformColor
      });
      
      // Add obstacles and special elements periodically
      if (level % 4 === 0 && level > 0) {
        // Checkpoints every 4 levels
        elements.push({
          type: 'checkpoint',
          pos: [x, height + 2, z],
          size: [1.5, 4, 0.5]
        });
      }
      
      if (level % 6 === 2) {
        // Moving platforms
        elements.push({
          type: 'moving_platform',
          pos: [x + 4, height + 1.5, z],
          size: [2, 0.5, 2],
          color: '#DDA0DD',
          moveType: 'horizontal',
          moveRange: 3
        });
      }
      
      if (level % 8 === 4) {
        // Jump pads
        elements.push({
          type: 'jumppad',
          pos: [x, height + 3, z + 3],
          size: [2, 0.5, 2]
        });
      }
      
      if (level % 10 === 6) {
        // Speed pads
        elements.push({
          type: 'speedpad',
          pos: [x - 2, height, z + 2],
          size: [2, 0.5, 2]
        });
      }
      
      if (level % 12 === 8 && level > 12) {
        // Kill parts (danger zones)
        elements.push({
          type: 'killpart',
          pos: [x + 2, height + 0.3, z - 2],
          size: [1, 0.6, 1]
        });
      }
      
      if (level % 15 === 10 && level > 15) {
        // Spinning obstacles
        elements.push({
          type: 'spinner',
          pos: [x, height + 2, z],
          size: [6, 0.5, 1],
          color: '#FF6347',
          spinSpeed: 0.02
        });
      }
    }
    
    // Central tower support columns (visual)
    for (let i = 0; i < 4; i++) {
      const angle = (i / 4) * Math.PI * 2;
      const x = centerX + Math.cos(angle) * 4;
      const z = centerZ + Math.sin(angle) * 4;
      
      elements.push({
        type: 'platform',
        pos: [x, 25, z],
        size: [1, 50, 1],
        color: '#696969'
      });
    }
    
    // Final victory platform at the top
    const finalHeight = 2 + totalLevels * (heightPerLevel / levelsPerFloor) + 5;
    elements.push({ 
      type: 'platform', 
      pos: [0, finalHeight, 0], 
      size: [8, 1, 8], 
      color: '#FFD700',
      material: 'victory'
    });
    
    // Victory sign
    elements.push({ 
      type: 'platform', 
      pos: [0, finalHeight + 6, 0], 
      size: [10, 4, 0.5], 
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