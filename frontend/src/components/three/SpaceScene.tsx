'use client';

/**
 * Lightweight Space Background
 * Pure CSS implementation for performance - no Three.js overhead
 */
export function SpaceScene() {
  return (
    <div className="absolute inset-0 overflow-hidden bg-[#0a0a12]">
      {/* Static star layers */}
      <div className="stars-layer-1" />
      <div className="stars-layer-2" />
      <div className="stars-layer-3" />
      
      {/* Nebula gradients */}
      <div 
        className="absolute inset-0 opacity-30"
        style={{
          background: `
            radial-gradient(ellipse 80% 50% at 20% 40%, rgba(98, 25, 255, 0.15) 0%, transparent 50%),
            radial-gradient(ellipse 60% 40% at 80% 60%, rgba(0, 184, 230, 0.1) 0%, transparent 50%),
            radial-gradient(ellipse 50% 30% at 50% 80%, rgba(0, 230, 108, 0.08) 0%, transparent 50%)
          `
        }}
      />
      
      {/* Distant sun glow */}
      <div 
        className="absolute w-32 h-32 rounded-full"
        style={{
          top: '15%',
          right: '20%',
          background: 'radial-gradient(circle, rgba(255, 170, 0, 0.4) 0%, rgba(255, 102, 0, 0.1) 40%, transparent 70%)',
          filter: 'blur(20px)',
        }}
      />
      
      {/* Planet silhouette */}
      <div 
        className="absolute w-48 h-48 rounded-full"
        style={{
          bottom: '10%',
          left: '5%',
          background: 'radial-gradient(circle at 30% 30%, #1a1a2e 0%, #0a0a12 100%)',
          boxShadow: 'inset -20px -10px 40px rgba(98, 25, 255, 0.2), 0 0 60px rgba(98, 25, 255, 0.1)',
        }}
      />

      <style jsx>{`
        .stars-layer-1, .stars-layer-2, .stars-layer-3 {
          position: absolute;
          inset: 0;
          background-repeat: repeat;
        }
        
        .stars-layer-1 {
          background-image: 
            radial-gradient(1px 1px at 10% 10%, rgba(255,255,255,0.8), transparent),
            radial-gradient(1px 1px at 20% 30%, rgba(255,255,255,0.6), transparent),
            radial-gradient(1.5px 1.5px at 35% 15%, rgba(255,255,255,0.9), transparent),
            radial-gradient(1px 1px at 45% 40%, rgba(255,255,255,0.5), transparent),
            radial-gradient(1px 1px at 55% 20%, rgba(255,255,255,0.7), transparent),
            radial-gradient(1px 1px at 65% 45%, rgba(255,255,255,0.6), transparent),
            radial-gradient(2px 2px at 80% 25%, rgba(255,255,255,0.8), transparent),
            radial-gradient(1px 1px at 90% 35%, rgba(255,255,255,0.5), transparent);
          background-size: 200px 200px;
        }
        
        .stars-layer-2 {
          background-image: 
            radial-gradient(1px 1px at 5% 50%, rgba(255,255,255,0.6), transparent),
            radial-gradient(1px 1px at 15% 70%, rgba(255,255,255,0.5), transparent),
            radial-gradient(1.5px 1.5px at 30% 55%, rgba(255,255,255,0.7), transparent),
            radial-gradient(1px 1px at 50% 80%, rgba(255,255,255,0.4), transparent),
            radial-gradient(1px 1px at 70% 60%, rgba(255,255,255,0.6), transparent),
            radial-gradient(1px 1px at 85% 75%, rgba(255,255,255,0.5), transparent);
          background-size: 300px 300px;
        }
        
        .stars-layer-3 {
          background-image: 
            radial-gradient(1px 1px at 8% 85%, rgba(255,255,255,0.5), transparent),
            radial-gradient(1px 1px at 25% 95%, rgba(255,255,255,0.4), transparent),
            radial-gradient(1px 1px at 60% 90%, rgba(255,255,255,0.5), transparent),
            radial-gradient(1.5px 1.5px at 75% 88%, rgba(255,255,255,0.6), transparent),
            radial-gradient(1px 1px at 95% 92%, rgba(255,255,255,0.4), transparent);
          background-size: 400px 400px;
        }
      `}</style>
    </div>
  );
}
