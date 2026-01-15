
import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Polygon, Tooltip, ZoomControl } from 'react-leaflet';
import { HistoricalEntity } from '../types';

interface HistoricalMapProps {
  entities: HistoricalEntity[];
  onSelectEntity: (entity: HistoricalEntity) => void;
  selectedEntityName?: string;
}

const HistoricalMap: React.FC<HistoricalMapProps> = ({ entities, onSelectEntity, selectedEntityName }) => {
  const [mapReady, setMapReady] = useState(false);

  useEffect(() => {
    setMapReady(true);
  }, []);

  if (!mapReady) return <div className="h-full w-full bg-slate-200 animate-pulse" />;

  const center: [number, number] = [40.0, -3.7];

  return (
    <div className="h-full w-full relative">
      <MapContainer 
        center={center} 
        zoom={6} 
        scrollWheelZoom={true} 
        className="h-full w-full"
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        />
        <ZoomControl position="bottomleft" />
        
        {entities.map((entity, idx) => {
          const isSelected = selectedEntityName === entity.name;
          return (
            <Polygon
              key={`${entity.name}-${idx}`}
              positions={entity.boundaryPoints}
              pathOptions={{
                fillColor: entity.color,
                fillOpacity: isSelected ? 0.8 : 0.45,
                color: entity.color,
                weight: isSelected ? 4 : 1.5,
                lineJoin: 'round',
                lineCap: 'round',
              }}
              eventHandlers={{
                click: () => onSelectEntity(entity),
                mouseover: (e) => {
                  if (!isSelected) {
                    e.target.setStyle({ fillOpacity: 0.7, weight: 2.5 });
                  }
                },
                mouseout: (e) => {
                  if (!isSelected) {
                    e.target.setStyle({ fillOpacity: 0.45, weight: 1.5 });
                  }
                }
              }}
            >
              <Tooltip 
                direction="center" 
                className="bg-transparent border-none shadow-none pointer-events-none"
              >
                <span 
                  className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest text-white shadow-md border border-white/20"
                  style={{ backgroundColor: entity.color, textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}
                >
                  {entity.name}
                </span>
              </Tooltip>
            </Polygon>
          );
        })}
      </MapContainer>
    </div>
  );
};

export default HistoricalMap;
