/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable react-hooks/immutability */
/* eslint-disable @typescript-eslint/no-unused-vars */
// @ts-nocheck
'use client';
import { useEffect, useRef, useState } from 'react';
import { extend, useFrame } from '@react-three/fiber';
import { useGLTF, useTexture } from '@react-three/drei';
import { BallCollider, Physics, RigidBody, useRopeJoint, useSphericalJoint } from '@react-three/rapier';
import { MeshLineGeometry, MeshLineMaterial } from 'meshline';
import * as THREE from 'three';
import './Lanyard.css';

extend({ MeshLineGeometry, MeshLineMaterial });

const lanyardTexture = '/lanyard/lanyard.png';
const cardGLB = '/lanyard/card.glb';
const logoPng = '/us_executive_logo.png';

export default function Lanyard() {
  const fixed = useRef<THREE.Vector3>(null);
  const j1 = useRef<THREE.Vector3>(null);
  const j2 = useRef<THREE.Vector3>(null);
  const j3 = useRef<THREE.Vector3>(null);
  const card = useRef<THREE.Vector3>(null);
  const band = useRef<THREE.Mesh>(null);

  const vec = new THREE.Vector3(),
    dir = new THREE.Vector3(),
    ang = new THREE.Vector3(),
    rot = new THREE.Vector3();
  const segmentProps = { type: 'dynamic', canSleep: true, colliders: false, angularDamping: 4, linearDamping: 4 };
  const { nodes, materials } = useGLTF(cardGLB);
  const texture = useTexture(lanyardTexture);

  const [curve] = useState(
    () =>
      new THREE.CatmullRomCurve3([new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3()])
  );
  const [dragged] = useState(false);
  const [hovered] = useState(false);

  useEffect(() => {
    curve.curveType = 'chordal';
    if (texture) {
      texture.wrapS = THREE.RepeatWrapping;
      texture.wrapT = THREE.RepeatWrapping;
      texture.needsUpdate = true;
    }
  }, [curve, texture]);

  useRopeJoint(fixed, j1, [[0, 0, 0], [0, 0, 0], 1]);
  useRopeJoint(j1, j2, [[0, 0, 0], [0, 0, 0], 1]);
  useRopeJoint(j2, j3, [[0, 0, 0], [0, 0, 0], 1]);
  useSphericalJoint(j3, card, [
    [0, 0, 0],
    [0, 1.5, 0]
  ]);

  useEffect(() => {
    if (hovered) {
      document.body.style.cursor = dragged ? 'grabbing' : 'grab';
      return () => void (document.body.style.cursor = 'auto');
    }
  }, [hovered, dragged]);

  return (
    <>
      <group position={[0, 4, 0]}>
        <RigidBody ref={fixed} {...segmentProps} type="fixed" />
        <RigidBody position={[0.5, 0, 0]} ref={j1} {...segmentProps}>
          <BallCollider args={[0.1]} />
        </RigidBody>
        <RigidBody position={[1, 0, 0]} ref={j2} {...segmentProps}>
          <BallCollider args={[0.1]} />
        </RigidBody>
        <RigidBody position={[1.5, 0, 0]} ref={j3} {...segmentProps}>
          <BallCollider args={[0.1]} />
        </RigidBody>
        <RigidBody position={[2, 0, 0]} ref={card} {...segmentProps} type={dragged ? 'kinematicPosition' : 'dynamic'}>
          <BallCollider args={[0.2]} type="ball" />
          <mesh ref={band}>
            <meshLineGeometry attach="geometry" />
            <meshLineMaterial
              attach="material"
              color={0xff00ff}
              linewidth={0.005}
              resolution={[1000, 100]}
              transparent
              opacity={0.75}
            />
          </mesh>
          <mesh castShadow receiveShadow geometry={nodes.card.geometry} material={materials.card}>
            <meshStandardTexture attach="material-map" texture={cardTexture} />
          </mesh>
        </RigidBody>
      </group>
    </>
  );
}