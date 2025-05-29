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
  const [lastCheckpoint, setLastCheckpoint] = useState({ x: 0, y: 0, z: 0 });
  const [currentCheckpoint, setCurrentCheckpoint] = useState(0);
  const [speedBoost, setSpeedBoost] = useState(1);
  const [speedBoostTimer, setSpeedBoostTimer] = useState(0);
  const [characterRotation, setCharacterRotation] = useState(0);
  const [cameraRotation, setCameraRotation] = useState({ horizontal: 0, vertical: 0 });
  const [isMouseLooking, setIsMouseLooking] = useState(false);
  const [lastMousePosition, setLastMousePosition] = useState({ x: 0, y: 0 });



  // Handle keyboard input - Arrow keys for camera, WASD for movement
  useEffect(() => {
    const handleKeyDown = (event) => {
      // Prevent default behavior for all game keys to avoid conflicts
      if (['KeyW', 'KeyA', 'KeyS', 'KeyD', 'Space', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.code)) {
        event.preventDefault();
      }
      
      // Arrow keys control camera rotation ONLY - don't add to movement keys
      if (event.code === 'ArrowLeft') {
        setCameraRotation(prev => ({ ...prev, horizontal: prev.horizontal - 0.1 }));
        return; // Don't add to keys state
      }
      if (event.code === 'ArrowRight') {
        setCameraRotation(prev => ({ ...prev, horizontal: prev.horizontal + 0.1 }));
        return; // Don't add to keys state
      }
      if (event.code === 'ArrowUp') {
        setCameraRotation(prev => ({ ...prev, vertical: Math.min(1, prev.vertical + 0.1) }));
        return; // Don't add to keys state
      }
      if (event.code === 'ArrowDown') {
        setCameraRotation(prev => ({ ...prev, vertical: Math.max(-1, prev.vertical - 0.1) }));
        return; // Don't add to keys state
      }
      
      // Only add WASD and Space to movement keys (prevent duplicates)
      if (['KeyW', 'KeyA', 'KeyS', 'KeyD', 'Space'].includes(event.code)) {
        setKeys(prev => {
          if (!prev[event.code]) {
            return { ...prev, [event.code]: true };
          }
          return prev;
        });
      }
    };
    
    const handleKeyUp = (event) => {
      // Prevent default behavior for all game keys
      if (['KeyW', 'KeyA', 'KeyS', 'KeyD', 'Space', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.code)) {
        event.preventDefault();
      }
      
      // Only remove WASD and Space from movement keys
      if (['KeyW', 'KeyA', 'KeyS', 'KeyD', 'Space'].includes(event.code)) {
        setKeys(prev => ({ ...prev, [event.code]: false }));
      }
    };

    // Use capture phase to ensure we get the events first
    window.addEventListener('keydown', handleKeyDown, { capture: true });
    window.addEventListener('keyup', handleKeyUp, { capture: true });
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown, { capture: true });
      window.removeEventListener('keyup', handleKeyUp, { capture: true });
    };
  }, []);

  // Handle mouse controls for camera rotation
  useEffect(() => {
    const handleMouseDown = (event) => {
      // Right mouse button enables mouse look
      if (event.button === 2) {
        setIsMouseLooking(true);
        setLastMousePosition({ x: event.clientX, y: event.clientY });
        // Request pointer lock for better mouse control
        document.body.requestPointerLock && document.body.requestPointerLock();
        event.preventDefault();
      }
    };

    const handleMouseUp = (event) => {
      if (event.button === 2) {
        setIsMouseLooking(false);
        // Exit pointer lock
        document.exitPointerLock && document.exitPointerLock();
      }
    };

    const handleMouseMove = (event) => {
      if (!isMouseLooking) return;

      // Use movementX/Y when pointer is locked, otherwise calculate delta
      let deltaX, deltaY;
      if (document.pointerLockElement) {
        deltaX = event.movementX || 0;
        deltaY = event.movementY || 0;
      } else {
        deltaX = event.clientX - lastMousePosition.x;
        deltaY = event.clientY - lastMousePosition.y;
        setLastMousePosition({ x: event.clientX, y: event.clientY });
      }

      const mouseSensitivity = 0.003; // Adjust this value to change mouse sensitivity
      
      setCameraRotation(prev => ({
        horizontal: prev.horizontal + deltaX * mouseSensitivity,
        vertical: Math.max(-1, Math.min(1, prev.vertical - deltaY * mouseSensitivity))
      }));
    };

    const handleContextMenu = (event) => {
      // Prevent right-click context menu when using mouse look
      event.preventDefault();
    };

    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('contextmenu', handleContextMenu);
    
    return () => {
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('contextmenu', handleContextMenu);
    };
  }, [isMouseLooking, lastMousePosition]);

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
    elements.push({ type: 'checkpoint', pos: [0, 0, 8], size: [2, 4, 0.5] });
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
    
    // Stage 3: Moving platforms (floors 5-6) - Enhanced Lego purple platforms
    elements.push({ type: 'checkpoint', pos: [0, 10, 64], size: [2, 4, 0.5] });
    for (let i = 0; i < 5; i++) {
      elements.push({ 
        type: 'moving_platform', 
        pos: [-8 + i * 4, 12 + i, 68 + i * 4], 
        size: [3, 1, 3], // Made them thicker and more substantial like Lego blocks
        color: '#8E44AD', // More authentic Lego purple color
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
    
    // Stage 5: Spinning obstacles (floors 9-10) - Enhanced with purple Lego elements
    elements.push({ type: 'checkpoint', pos: [0, 28, 116], size: [2, 4, 0.5] });
    
    // Add some purple support platforms before the spinners
    elements.push({ 
      type: 'platform', 
      pos: [-4, 29, 118], 
      size: [2, 1, 2], 
      color: '#8E44AD' // Purple Lego platform
    });
    elements.push({ 
      type: 'platform', 
      pos: [4, 29, 118], 
      size: [2, 1, 2], 
      color: '#8E44AD' // Purple Lego platform
    });
    
    for (let i = 0; i < 3; i++) {
      elements.push({ 
        type: 'spinner', 
        pos: [0, 30 + i * 3, 120 + i * 6], 
        size: [8, 0.8, 1], // Made thicker for better Lego appearance
        color: '#8E44AD', // Changed to purple to match theme
        spinSpeed: 0.02 + i * 0.01
      });
      elements.push({ 
        type: 'platform', 
        pos: [0, 30 + i * 3, 124 + i * 6], 
        size: [3, 1, 3], // Made larger and thicker
        color: '#8E44AD' // Purple Lego platforms
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
      // Spawn character properly on the platform (platform top + character height)
      // Spawn platform is at Y=0 with height 0.5, so top is at Y=0.25
      // Character needs to be at Y=1.25 to stand on platform
      groupRef.current.position.set(lastCheckpoint.x, 1.25, lastCheckpoint.z);
      setVelocity({ x: 0, y: 0, z: 0 }); // No falling velocity
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

    // Prevent physics tunneling at low frame rates
    const maxDelta = 0.05; // Emergency cap at 20 FPS equivalent
    const clampedDelta = Math.min(delta, 0.033); // Cap at ~30 FPS equivalent
    
    // If frame rate is extremely low, use sub-stepping
    const actualDelta = delta > maxDelta ? maxDelta : clampedDelta;
    const subSteps = delta > maxDelta ? Math.ceil(delta / maxDelta) : 1;
    const stepDelta = actualDelta / subSteps;
    
    // Perform physics in sub-steps to prevent tunneling
    for (let step = 0; step < subSteps; step++) {
      performPhysicsStep(stepDelta);
    }
  });

  const performPhysicsStep = (delta) => {
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

    // Handle movement - WASD relative to camera direction (PROPER IMPLEMENTATION)
    let isMoving = false;
    let moveVector = new THREE.Vector3(0, 0, 0);
    
    // Get camera's world direction (where camera is looking)
    const cameraDirection = new THREE.Vector3();
    camera.getWorldDirection(cameraDirection);
    cameraDirection.y = 0; // Remove vertical component for ground-based movement
    cameraDirection.normalize();
    
    // Calculate right vector (perpendicular to camera direction)
    const cameraRight = new THREE.Vector3();
    cameraRight.crossVectors(cameraDirection, camera.up).normalize(); // Swapped order to fix left/right
    
    // WASD movement relative to camera orientation
    if (keys['KeyW']) {
      moveVector.add(cameraDirection); // Move in camera's forward direction
      isMoving = true;
    }
    if (keys['KeyS']) {
      moveVector.add(cameraDirection.clone().multiplyScalar(-1)); // Move opposite to camera direction
      isMoving = true;
    }
    if (keys['KeyA']) {
      moveVector.add(cameraRight.clone().multiplyScalar(-1)); // Move left relative to camera
      isMoving = true;
    }
    if (keys['KeyD']) {
      moveVector.add(cameraRight); // Move right relative to camera
      isMoving = true;
    }
    
    // Apply movement and character rotation
    if (moveVector.length() > 0) {
      // Character should face the direction they're moving (camera-relative)
      const targetRotation = Math.atan2(moveVector.x, moveVector.z);
      
      // Calculate relative rotation (shortest path)
      let rotationDiff = targetRotation - characterRotation;
      
      // Normalize rotation difference to [-π, π] range
      while (rotationDiff > Math.PI) {
        rotationDiff -= 2 * Math.PI;
      }
      while (rotationDiff < -Math.PI) {
        rotationDiff += 2 * Math.PI;
      }
      
      // Apply the relative rotation
      setCharacterRotation(prev => prev + rotationDiff);
      
      // Apply movement
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

    // Fixed platform collision detection - restored working values
    let onPlatform = false;
    const tolerance = 0.3; // Conservative tolerance that works cross-platform
    const verticalTolerance = 0.1;
    
    // Check collision with spawn platform first
    const spawnPlatform = { pos: [0, 0, 0], size: [6, 0.5, 6], type: 'platform' };
    const playerBottom = newPos.y - 0.5;
    
    // Spawn platform collision with working tolerances
    if (playerBottom <= spawnPlatform.pos[1] + spawnPlatform.size[1]/2 + verticalTolerance && 
        playerBottom >= spawnPlatform.pos[1] - spawnPlatform.size[1]/2 - 0.5) {
      
      const isOnSpawn = Math.abs(newPos.x - spawnPlatform.pos[0]) <= spawnPlatform.size[0]/2 + tolerance && 
                       Math.abs(newPos.z - spawnPlatform.pos[2]) <= spawnPlatform.size[2]/2 + tolerance;
      
      if (isOnSpawn && newVelocity.y <= 0.1) {
        newPos.y = spawnPlatform.pos[1] + spawnPlatform.size[1]/2 + 0.5;
        newVelocity.y = Math.max(0, newVelocity.y);
        onPlatform = true;
        setIsGrounded(true);
      }
    }
    
    // Check collision with spiral tower platforms
    if (!onPlatform) {
      const centerX = 0, centerZ = 0, baseRadius = 8, totalLevels = 50;
      const heightIncrement = 0.8, platformsPerRotation = 12;
      
      // Only check platforms near the player's height for better performance
      const playerHeight = newPos.y;
      const startLevel = Math.max(0, Math.floor((playerHeight - 3) / heightIncrement));
      const endLevel = Math.min(totalLevels, Math.floor((playerHeight + 3) / heightIncrement) + 1);
      
      for (let level = startLevel; level < endLevel; level++) {
        const angle = (level / platformsPerRotation) * Math.PI * 2;
        const height = 1.5 + level * heightIncrement;
        const radius = baseRadius + Math.sin(level * 0.2) * 1;
        
        const x = centerX + Math.cos(angle) * radius;
        const z = centerZ + Math.sin(angle) * radius;
        
        let platformSize = [2.5, 0.5, 2.5];
        if (height < 10) platformSize = [3, 0.5, 3];
        else if (height < 20) platformSize = [2.5, 0.5, 2.5];
        else if (height < 30) platformSize = [2, 0.5, 2];
        else platformSize = [1.8, 0.5, 1.8];
        
        // Platform collision check with working values
        if (playerBottom <= height + platformSize[1]/2 + verticalTolerance && 
            playerBottom >= height - platformSize[1]/2 - 0.5) {
          
          const isOnPlatform = Math.abs(newPos.x - x) <= platformSize[0]/2 + tolerance && 
                              Math.abs(newPos.z - z) <= platformSize[2]/2 + tolerance;
          
          if (isOnPlatform && newVelocity.y <= 0.1) {
            newPos.y = height + platformSize[1]/2 + 0.5;
            newVelocity.y = Math.max(0, newVelocity.y);
            onPlatform = true;
            setIsGrounded(true);
            break;
          }
        }
        
        // Check bridge platforms
        if (level % 4 === 1 && level > 0) {
          const prevAngle = ((level - 1) / platformsPerRotation) * Math.PI * 2;
          const prevX = centerX + Math.cos(prevAngle) * radius;
          const prevZ = centerZ + Math.sin(prevAngle) * radius;
          const prevHeight = 1.5 + (level - 1) * heightIncrement;
          
          const bridgeX = (x + prevX) / 2;
          const bridgeZ = (z + prevZ) / 2;
          const bridgeHeight = (height + prevHeight) / 2;
          const bridgeSize = [1.5, 0.5, 1.5];
          
          if (playerBottom <= bridgeHeight + bridgeSize[1]/2 + verticalTolerance && 
              playerBottom >= bridgeHeight - bridgeSize[1]/2 - 0.5) {
            
            const isOnBridge = Math.abs(newPos.x - bridgeX) <= bridgeSize[0]/2 + tolerance && 
                              Math.abs(newPos.z - bridgeZ) <= bridgeSize[2]/2 + tolerance;
            
            if (isOnBridge && newVelocity.y <= 0.1) {
              newPos.y = bridgeHeight + bridgeSize[1]/2 + 0.5;
              newVelocity.y = Math.max(0, newVelocity.y);
              onPlatform = true;
              setIsGrounded(true);
              break;
            }
          }
        }
      }
    }
    
    if (!onPlatform) {
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

    // Camera system controlled by arrow keys
    const cameraDistance = 8;
    const cameraHeight = 6;
    const cameraSpeed = 0.08;
    
    // Apply camera rotation from arrow keys
    const horizontalAngle = cameraRotation.horizontal;
    const verticalOffset = cameraRotation.vertical * 3; // Scale vertical movement
    
    // Camera position with arrow key controls
    const idealCameraPos = new THREE.Vector3(
      newPos.x + Math.cos(horizontalAngle) * cameraDistance * 0.7,
      newPos.y + cameraHeight + verticalOffset,
      newPos.z + Math.sin(horizontalAngle) * cameraDistance * 0.7
    );
    
    // Smooth camera follow
    camera.position.lerp(idealCameraPos, cameraSpeed);
    camera.lookAt(newPos.x, newPos.y + 2, newPos.z);
  });

  return (
    <group ref={groupRef} position={position} rotation={[0, characterRotation, 0]}>
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