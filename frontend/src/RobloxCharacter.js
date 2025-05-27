import React, { useRef, useState, useEffect, useCallback } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Box, Cylinder } from '@react-three/drei';
import * as THREE from 'three';

// Roblox-style Humanoid Character Component
function RobloxCharacter({ position, onPositionChange, onCheckpointReached }) {
  const groupRef = useRef();
  const headRef = useRef();
  const torsoRef = useRef();
  const leftArmRef = useRef();
  const rightArmRef = useRef();
  const leftLegRef = useRef();
  const rightLegRef = useRef();
  
  const { camera } = useThree();
  
  const [velocity, setVelocity] = useState({ x: 0, y: 0, z: 0 });
  const [isGrounded, setIsGrounded] = useState(false);
  const [keys, setKeys] = useState({});
  const [lastCheckpoint, setLastCheckpoint] = useState({ x: 0, y: 2, z: 0 });
  const [currentCheckpoint, setCurrentCheckpoint] = useState(0);
  const [speedBoost, setSpeedBoost] = useState(1);
  const [speedBoostTimer, setSpeedBoostTimer] = useState(0);
  const [cameraOffset, setCameraOffset] = useState({ horizontal: 0, vertical: 0 });
  const [characterRotation, setCharacterRotation] = useState(0);

  // Handle keyboard input (including camera controls)
  useEffect(() => {
    const handleKeyDown = (event) => {
      setKeys(prev => ({ ...prev, [event.code]: true }));
      
      // Camera controls with Q/E for horizontal rotation only
      if (event.code === 'KeyQ') {
        setCameraOffset(prev => ({ ...prev, horizontal: prev.horizontal - 0.5 }));
      }
      if (event.code === 'KeyE') {
        setCameraOffset(prev => ({ ...prev, horizontal: prev.horizontal + 0.5 }));
      }
      // Reset camera with C
      if (event.code === 'KeyC') {
        setCameraOffset({ horizontal: 0, vertical: 0 });
      }
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

  // Obby elements with Roblox-style design
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
    // Kill parts maze
    for (let i = 0; i < 8; i++) {
      const x = -6 + i * 1.5;
      elements.push({ type: 'killpart', pos: [x, 9.3, 56], size: [1, 0.6, 1] });
      elements.push({ type: 'platform', pos: [x, 9, 58], size: [1, 0.5, 1], color: '#87CEEB' });
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
    
    // Final platform - Victory!
    elements.push({ 
      type: 'platform', 
      pos: [0, 40, 140], 
      size: [6, 1, 6], 
      color: '#FFD700',
      material: 'victory'
    });
    
    return elements;
  };

  // Respawn function
  const respawnPlayer = () => {
    if (groupRef.current) {
      groupRef.current.position.set(lastCheckpoint.x, lastCheckpoint.y, lastCheckpoint.z);
      setVelocity({ x: 0, y: 0, z: 0 });
      setIsGrounded(true);
    }
  };

  // Walking animation
  const animateWalk = (isMoving) => {
    if (!isMoving) return;
    
    const time = Date.now() * 0.01;
    const walkCycle = Math.sin(time) * 0.3;
    
    if (leftArmRef.current) leftArmRef.current.rotation.x = -walkCycle;
    if (rightArmRef.current) rightArmRef.current.rotation.x = walkCycle;
    if (leftLegRef.current) leftLegRef.current.rotation.x = walkCycle;
    if (rightLegRef.current) rightLegRef.current.rotation.x = -walkCycle;
  };

  // Physics and movement
  useFrame((state, delta) => {
    if (!groupRef.current) return;

    const baseSpeed = 12;
    const moveSpeed = baseSpeed * speedBoost;
    const jumpForce = 18;
    const gravity = -35;

    // Handle speed boost timer
    if (speedBoostTimer > 0) {
      setSpeedBoostTimer(prev => prev - delta);
      if (speedBoostTimer <= 0) {
        setSpeedBoost(1);
      }
    }

    // Get current position
    const currentPos = groupRef.current.position;
    
    // Apply gravity
    let newVelocity = { ...velocity };
    newVelocity.y += gravity * delta;

    // Handle movement with two different control schemes
    let isMoving = false;
    let moveVector = new THREE.Vector3(0, 0, 0);
    
    // WASD - Camera relative movement
    if (keys['KeyW'] || keys['KeyA'] || keys['KeyS'] || keys['KeyD']) {
      // Calculate camera direction vectors
      const horizontalAngle = cameraOffset.horizontal;
      const cameraForward = new THREE.Vector3(
        -Math.sin(horizontalAngle),  // Forward X component
        0,                           // No Y movement for forward
        -Math.cos(horizontalAngle)   // Forward Z component
      ).normalize();
      
      const cameraRight = new THREE.Vector3(
        Math.cos(horizontalAngle),   // Right X component
        0,                           // No Y movement for right
        -Math.sin(horizontalAngle)   // Right Z component
      ).normalize();
      
      if (keys['KeyA']) {
        moveVector.add(cameraRight.clone().multiplyScalar(-1)); // Move left relative to camera
        isMoving = true;
      }
      if (keys['KeyD']) {
        moveVector.add(cameraRight); // Move right relative to camera
        isMoving = true;
      }
      if (keys['KeyW']) {
        moveVector.add(cameraForward); // Move forward relative to camera
        isMoving = true;
      }
      if (keys['KeyS']) {
        moveVector.add(cameraForward.clone().multiplyScalar(-1)); // Move backward relative to camera
        isMoving = true;
      }
    }
    
    // Arrow Keys - Character facing direction (world coordinates)
    if (keys['ArrowLeft'] || keys['ArrowRight'] || keys['ArrowUp'] || keys['ArrowDown']) {
      // Character forward direction (initially facing negative Z)
      const characterForward = new THREE.Vector3(
        -Math.sin(characterRotation),
        0,
        -Math.cos(characterRotation)
      ).normalize();
      
      const characterRight = new THREE.Vector3(
        Math.cos(characterRotation),
        0,
        -Math.sin(characterRotation)
      ).normalize();
      
      if (keys['ArrowLeft']) {
        moveVector.add(characterRight.clone().multiplyScalar(-1)); // Move left relative to character
        // Turn character left
        setCharacterRotation(prev => prev - 0.05);
        isMoving = true;
      }
      if (keys['ArrowRight']) {
        moveVector.add(characterRight); // Move right relative to character
        // Turn character right
        setCharacterRotation(prev => prev + 0.05);
        isMoving = true;
      }
      if (keys['ArrowUp']) {
        moveVector.add(characterForward); // Move forward in character's facing direction
        isMoving = true;
      }
      if (keys['ArrowDown']) {
        moveVector.add(characterForward.clone().multiplyScalar(-1)); // Move backward from character's facing direction
        isMoving = true;
      }
    }
    
    // Apply movement
    if (moveVector.length() > 0) {
      moveVector.normalize().multiplyScalar(moveSpeed);
      newVelocity.x = moveVector.x;
      newVelocity.z = moveVector.z;
    } else {
      newVelocity.x *= 0.8;
      newVelocity.z *= 0.8;
    }

    // Animate character
    animateWalk(isMoving);

    // Jumping
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

    // Collision detection with obby elements
    let onPlatform = false;
    const elements = getObbyElements();
    
    for (const element of elements) {
      const [ex, ey, ez] = element.pos;
      const playerBottom = newPos.y - 0.5; // Character height adjustment
      
      // Platform collision
      if (element.type === 'platform' || element.type === 'spawn' || element.type === 'moving_platform') {
        if (playerBottom <= ey + element.size[1]/2 + 0.1 && 
            playerBottom >= ey - element.size[1]/2 - 0.5 && 
            velocity.y <= 0.1) {
          
          const [w, h, d] = element.size;
          const isOnPlatform = Math.abs(newPos.x - ex) <= w/2 + 0.3 && 
                              Math.abs(newPos.z - ez) <= d/2 + 0.3;
          
          if (isOnPlatform) {
            newPos.y = ey + element.size[1]/2 + 0.5;
            newVelocity.y = Math.max(0, newVelocity.y);
            onPlatform = true;
            setIsGrounded(true);
            break;
          }
        }
      }
      
      // Checkpoint collision
      else if (element.type === 'checkpoint') {
        const distance = Math.sqrt(
          (newPos.x - ex) ** 2 + (newPos.z - ez) ** 2
        );
        if (distance <= 2) {
          setLastCheckpoint({ x: ex, y: ey + 1, z: ez });
          if (onCheckpointReached) {
            onCheckpointReached(currentCheckpoint + 1);
          }
          setCurrentCheckpoint(prev => prev + 1);
        }
      }
      
      // Kill part collision
      else if (element.type === 'killpart') {
        const [w, h, d] = element.size;
        const isTouch = Math.abs(newPos.x - ex) <= w/2 + 0.3 && 
                       Math.abs(newPos.y - ey) <= h/2 + 0.8 &&
                       Math.abs(newPos.z - ez) <= d/2 + 0.3;
        
        if (isTouch) {
          respawnPlayer();
          return;
        }
      }
      
      // Jump pad collision
      else if (element.type === 'jumppad') {
        const [w, h, d] = element.size;
        const isOnJumpPad = Math.abs(newPos.x - ex) <= w/2 + 0.3 && 
                           Math.abs(newPos.z - ez) <= d/2 + 0.3 &&
                           playerBottom <= ey + h/2 + 0.2 && 
                           playerBottom >= ey - h/2 - 0.2;
        
        if (isOnJumpPad && velocity.y <= 0.1) {
          newVelocity.y = 25; // Super jump
          setIsGrounded(false);
        }
      }
      
      // Speed pad collision
      else if (element.type === 'speedpad') {
        const [w, h, d] = element.size;
        const isOnSpeedPad = Math.abs(newPos.x - ex) <= w/2 + 0.3 && 
                            Math.abs(newPos.z - ez) <= d/2 + 0.3 &&
                            playerBottom <= ey + h/2 + 0.2 && 
                            playerBottom >= ey - h/2 - 0.2;
        
        if (isOnSpeedPad) {
          setSpeedBoost(2);
          setSpeedBoostTimer(3); // 3 seconds of speed boost
        }
      }
    }

    if (!onPlatform && newVelocity.y <= 0) {
      setIsGrounded(false);
    }

    // Fall detection - respawn if too low
    if (newPos.y < -10) {
      respawnPlayer();
      return;
    }

    // Update character position
    groupRef.current.position.set(newPos.x, newPos.y, newPos.z);
    setVelocity(newVelocity);
    
    if (onPositionChange) {
      onPositionChange(newPos);
    }

    // Improved camera system with manual controls
    const cameraDistance = 8;  // Closer to player
    const cameraHeight = 6;    // Lower height for better view
    const cameraSpeed = 0.08;  // Faster follow for responsiveness
    
    // Apply manual camera offsets
    const verticalOffset = cameraOffset.vertical;
    
    // Camera position relative to player with manual adjustments
    const horizontalAngle = cameraOffset.horizontal;  // Get the horizontal angle from cameraOffset
    const idealCameraPos = new THREE.Vector3(
      newPos.x + Math.cos(horizontalAngle) * cameraDistance * 0.7,  // Adjustable horizontal position
      newPos.y + cameraHeight + verticalOffset,                     // Adjustable height
      newPos.z + Math.sin(horizontalAngle) * cameraDistance * 0.7   // Adjustable depth
    );
    
    // Smooth camera movement with better responsiveness
    camera.position.lerp(idealCameraPos, cameraSpeed);
    
    // Look slightly ahead of the player in the direction they're moving
    const lookTarget = new THREE.Vector3(
      newPos.x + newVelocity.x * 0.3,  // Look ahead based on movement
      newPos.y + 2,                    // Look slightly above player
      newPos.z + newVelocity.z * 0.3   // Look ahead based on movement
    );
    
    camera.lookAt(lookTarget);
  });

  return (
    <group ref={groupRef} position={position}>
      {/* Head */}
      <Box ref={headRef} position={[0, 1.5, 0]} args={[0.8, 0.8, 0.8]} castShadow>
        <meshStandardMaterial color="#FFDBAC" />
      </Box>
      
      {/* Torso */}
      <Box ref={torsoRef} position={[0, 0.3, 0]} args={[1, 1.2, 0.6]} castShadow>
        <meshStandardMaterial color="#4FC3F7" />
      </Box>
      
      {/* Left Arm */}
      <Box ref={leftArmRef} position={[-0.8, 0.5, 0]} args={[0.4, 1, 0.4]} castShadow>
        <meshStandardMaterial color="#FFDBAC" />
      </Box>
      
      {/* Right Arm */}
      <Box ref={rightArmRef} position={[0.8, 0.5, 0]} args={[0.4, 1, 0.4]} castShadow>
        <meshStandardMaterial color="#FFDBAC" />
      </Box>
      
      {/* Left Leg */}
      <Box ref={leftLegRef} position={[-0.3, -0.8, 0]} args={[0.4, 1.2, 0.4]} castShadow>
        <meshStandardMaterial color="#2E7D32" />
      </Box>
      
      {/* Right Leg */}
      <Box ref={rightLegRef} position={[0.3, -0.8, 0]} args={[0.4, 1.2, 0.4]} castShadow>
        <meshStandardMaterial color="#2E7D32" />
      </Box>
      
      {/* Simple face on head */}
      <Box position={[0, 1.5, 0.41]} args={[0.1, 0.1, 0.01]}>
        <meshStandardMaterial color="#000000" />
      </Box>
      <Box position={[-0.2, 1.5, 0.41]} args={[0.08, 0.08, 0.01]}>
        <meshStandardMaterial color="#000000" />
      </Box>
      <Box position={[0.2, 1.5, 0.41]} args={[0.08, 0.08, 0.01]}>
        <meshStandardMaterial color="#000000" />
      </Box>
    </group>
  );
}

export default RobloxCharacter;