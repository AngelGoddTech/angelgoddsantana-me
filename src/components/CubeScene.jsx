import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

// Neon glass cube with glowing edges and face labels to mimic the mock
export default function CubeScene({ className = '' }) {
  const mountRef = useRef(null);
  const animationRef = useRef(0);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const width = mount.clientWidth;
    const height = mount.clientHeight;

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x0b1120, 0.016);

    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 1000);
    camera.position.z = 6;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    renderer.setClearColor(0x000000, 0); // transparent
    mount.appendChild(renderer.domElement);

    // Lights for physical/glass effect
    const hemi = new THREE.HemisphereLight(0xb4f0ff, 0xffc6b7, 0.7);
    scene.add(hemi);
    const dir = new THREE.DirectionalLight(0xff1ba6, 1.0);
    dir.position.set(5, 6, 5);
    scene.add(dir);

    // Group to hold cube and adornments
    const group = new THREE.Group();
    scene.add(group);

    // Base glass-like cube
    const cubeGeo = new THREE.BoxGeometry(2, 2, 2);
    const glassMat = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color('#0d1421'),
      metalness: 0.0,
      roughness: 0.05,
      transmission: 0.9, // glass effect
      thickness: 0.4,
      transparent: true,
      opacity: 0.6,
      ior: 1.2,
      reflectivity: 0.1,
    });
    const glassCube = new THREE.Mesh(cubeGeo, glassMat);
    group.add(glassCube);

    // Glowing edges (neon)
    const edgeGeo = new THREE.EdgesGeometry(cubeGeo);
    const edgeMat = new THREE.LineBasicMaterial({ color: new THREE.Color('#00B3FF'), transparent: true, opacity: 0.95, depthWrite: false });
    const edges = new THREE.LineSegments(edgeGeo, edgeMat);
    group.add(edges);

    // Soft outer glow box (slightly larger, additive)
    const glowMat = new THREE.MeshBasicMaterial({ color: '#00B3FF', blending: THREE.AdditiveBlending, transparent: true, opacity: 0.08, depthWrite: false });
    const glowCube = new THREE.Mesh(new THREE.BoxGeometry(2.1, 2.1, 2.1), glowMat);
    group.add(glowCube);

    // Utility to create a neon text CanvasTexture
    const makeLabelTexture = (text, baseColor = '#ffffff', glowColor = '#00B3FF') => {
      const size = 512;
      const canvas = document.createElement('canvas');
      canvas.width = canvas.height = size;
      const ctx = canvas.getContext('2d');
      if (!ctx) return null;
      ctx.clearRect(0, 0, size, size);

      // Subtle grid/scan background
      ctx.fillStyle = 'rgba(13,20,33,0.18)';
      ctx.fillRect(0, 0, size, size);
      ctx.strokeStyle = 'rgba(180,240,255,0.1)';
      ctx.lineWidth = 1;
      for (let y = 0; y < size; y += 32) {
        ctx.beginPath();
        ctx.moveTo(0, y + 0.5);
        ctx.lineTo(size, y + 0.5);
        ctx.stroke();
      }

      // Neon text with glow
      ctx.font = 'bold 140px Inter, Arial, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.shadowColor = glowColor;
      ctx.shadowBlur = 40;
      ctx.fillStyle = baseColor;
      ctx.fillText(text, size / 2, size / 2);

      // Accent streaks
      ctx.shadowBlur = 0;
      ctx.globalAlpha = 0.5;
      const grad = ctx.createLinearGradient(0, 0, size, size);
      grad.addColorStop(0, '#00B3FF');
      grad.addColorStop(0.5, '#FF1BA6');
      grad.addColorStop(1, '#00FF87');
      ctx.strokeStyle = grad;
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.moveTo(60, size * 0.25);
      ctx.lineTo(size - 60, size * 0.25);
      ctx.moveTo(100, size * 0.75);
      ctx.lineTo(size - 100, size * 0.75);
      ctx.stroke();
      ctx.globalAlpha = 1;

      const tex = new THREE.CanvasTexture(canvas);
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.needsUpdate = true;
      return tex;
    };

    // Label planes slightly outside cube to avoid z-fighting
    const labelMatAzure = new THREE.MeshBasicMaterial({
      map: makeLabelTexture('Azure', '#EFFFFF', '#00B3FF'),
      transparent: true,
      side: THREE.FrontSide,
      depthWrite: false,
    });
    const labelMatGemini = new THREE.MeshBasicMaterial({
      map: makeLabelTexture('Gemini', '#EFFFFF', '#FF1BA6'),
      transparent: true,
      side: THREE.FrontSide,
      depthWrite: false,
    });
    const planeGeo = new THREE.PlaneGeometry(2.02, 2.02);
    const planeLeft = new THREE.Mesh(planeGeo, labelMatAzure);
    planeLeft.position.x = -1.01; // left face
    planeLeft.rotation.y = Math.PI / 2;
    const planeRight = new THREE.Mesh(planeGeo, labelMatGemini);
    planeRight.position.x = 1.01; // right face
    planeRight.rotation.y = -Math.PI / 2;
    group.add(planeLeft, planeRight);

    // Top-face logo plane (generic neon "G"-like mark)
    const makeTopLogoTexture = () => {
      const size = 512;
      const c = document.createElement('canvas');
      c.width = c.height = size;
      const ctx = c.getContext('2d');
      if (!ctx) return null;
      ctx.clearRect(0, 0, size, size);

      // radial gradient background glow
      const rad = ctx.createRadialGradient(size/2, size/2, 10, size/2, size/2, size/2);
      rad.addColorStop(0, 'rgba(0,179,255,0.25)');
      rad.addColorStop(1, 'rgba(0,179,255,0)');
      ctx.fillStyle = rad;
      ctx.beginPath();
      ctx.arc(size/2, size/2, size*0.45, 0, Math.PI*2);
      ctx.fill();

      // gradient stroke for the emblem
      const grad = ctx.createLinearGradient(0, 0, size, size);
      grad.addColorStop(0, '#00B3FF');
      grad.addColorStop(0.5, '#FF1BA6');
      grad.addColorStop(1, '#00FF87');
      ctx.strokeStyle = grad;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.lineWidth = 46;
      ctx.shadowColor = '#00E0FF';
      ctx.shadowBlur = 22;

      // Draw a broken ring with a notch (suggestive G)
      ctx.beginPath();
      ctx.arc(size/2, size/2, size*0.22, Math.PI*0.15, Math.PI*1.8);
      ctx.stroke();
      ctx.shadowBlur = 0;

      // small notch bar
      ctx.lineWidth = 36;
      ctx.beginPath();
      ctx.moveTo(size*0.64, size*0.52);
      ctx.lineTo(size*0.78, size*0.52);
      ctx.stroke();

      const tex = new THREE.CanvasTexture(c);
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.needsUpdate = true;
      return tex;
    };
    const topLogoMat = new THREE.MeshBasicMaterial({
      map: makeTopLogoTexture(),
      transparent: true,
      depthWrite: false,
    });
    const topPlane = new THREE.Mesh(new THREE.PlaneGeometry(2.02, 2.02), topLogoMat);
    topPlane.position.y = 1.01; // top face
    topPlane.rotation.x = -Math.PI / 2;
    group.add(topPlane);

    // Neon orbit rings around cube (angled tori)
    const ringGroup = new THREE.Group();
    ringGroup.rotation.x = THREE.MathUtils.degToRad(24);
    ringGroup.rotation.y = THREE.MathUtils.degToRad(-10);
    group.add(ringGroup);

    const makeRing = (radius, color, opacity = 0.35) => {
      const geo = new THREE.TorusGeometry(radius, 0.02, 16, 256);
      const mat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity, blending: THREE.AdditiveBlending, depthWrite: false });
      const m = new THREE.Mesh(geo, mat);
      return { mesh: m, geo, mat };
    };
    const ring1 = makeRing(1.35, '#00B3FF', 0.35);
    const ring2 = makeRing(1.55, '#FF1BA6', 0.28);
    const ring3 = makeRing(1.75, '#00FF87', 0.22);
    ringGroup.add(ring1.mesh, ring2.mesh, ring3.mesh);

    // Subtle inner particle field
    const particlesCount = 400;
    const positions = new Float32Array(particlesCount * 3);
    for (let i = 0; i < particlesCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 1.8;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 1.8;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 1.8;
    }
    const pGeo = new THREE.BufferGeometry();
    pGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const pMat = new THREE.PointsMaterial({ size: 0.025, color: '#B4F0FF', transparent: true, opacity: 0.7 });
    const innerPoints = new THREE.Points(pGeo, pMat);
    group.add(innerPoints);

    // Mouse interaction
    const mouse = new THREE.Vector2(0, 0);
    const onPointerMove = (e) => {
      const rect = mount.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;
      const y = (e.clientY - rect.top) / rect.height;
      mouse.x = x * 2 - 1;
      mouse.y = -(y * 2 - 1);
    };
    mount.addEventListener('pointermove', onPointerMove);

    const onResize = () => {
      const w = mount.clientWidth;
      const h = mount.clientHeight;
      renderer.setSize(w, h);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    window.addEventListener('resize', onResize);

    // Animate hues for edges/glow to simulate neon cycling
    const neonColors = ['#00B3FF', '#FF1BA6', '#00FF87'];
    let hueIndex = 0;
    let t = 0;
    const animate = () => {
      t += 0.01;
      group.rotation.x += 0.005 + mouse.y * 0.002;
      group.rotation.y += 0.007 + mouse.x * 0.002;
      innerPoints.rotation.y += 0.003;
      innerPoints.position.y = Math.sin(t * 0.6) * 0.08;

      // orbit ring spins
      ring1.mesh.rotation.z += 0.0065;
      ring2.mesh.rotation.z -= 0.0045;
      ring3.mesh.rotation.z += 0.0035;

      // cycle edge colors smoothly
      if (Math.floor(t * 2) % 60 === 0) {
        hueIndex = (hueIndex + 1) % neonColors.length;
        const col = new THREE.Color(neonColors[hueIndex]);
        edgeMat.color.copy(col);
        glowMat.color = col;
        ring1.mat.color.copy(col);
      }

      renderer.render(scene, camera);
      animationRef.current = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      cancelAnimationFrame(animationRef.current);
      window.removeEventListener('resize', onResize);
      mount.removeEventListener('pointermove', onPointerMove);
      mount.removeChild(renderer.domElement);
      renderer.dispose();
      cubeGeo.dispose();
      edgeGeo.dispose();
      glassMat.dispose();
      glowMat.dispose();
      pGeo.dispose();
      pMat.dispose();
  // dispose logo & rings
  topLogoMat.map?.dispose?.();
  topLogoMat.dispose();
  ring1.geo.dispose(); ring2.geo.dispose(); ring3.geo.dispose();
  ring1.mat.dispose(); ring2.mat.dispose(); ring3.mat.dispose();
    };
  }, []);

  return (
    <div ref={mountRef} className={`w-full h-full rounded-2xl glass-neo ${className}`} />
  );
}
