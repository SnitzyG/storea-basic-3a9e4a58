import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';

export interface ConstructionItem {
  id: string;
  section: string;
  item: string;
  description: string;
  unit: string;
}

const BUILDING_SECTIONS: ConstructionItem[] = [
  // Preliminaries
  { id: 'prelim-1', section: 'Preliminaries', item: 'Site Establishment', description: 'Site office, amenities, and temporary works', unit: 'LS' },
  { id: 'prelim-2', section: 'Preliminaries', item: 'Permits & Approvals', description: 'Building permits and approval costs', unit: 'LS' },
  { id: 'prelim-3', section: 'Preliminaries', item: 'Site Security', description: 'Fencing, security, and safety measures', unit: 'LS' },
  
  // Demolition
  { id: 'demo-1', section: 'Demolition', item: 'Structure Demolition', description: 'Demolition of existing structures', unit: 'LS' },
  { id: 'demo-2', section: 'Demolition', item: 'Site Clearing', description: 'Vegetation and site clearing', unit: 'LS' },
  { id: 'demo-3', section: 'Demolition', item: 'Waste Removal', description: 'Disposal of demolition waste', unit: 'LS' },
  
  // Slab
  { id: 'slab-1', section: 'Slab', item: 'Excavation', description: 'Site excavation and earthworks', unit: 'm³' },
  { id: 'slab-2', section: 'Slab', item: 'Footings', description: 'Strip and pad footings', unit: 'm³' },
  { id: 'slab-3', section: 'Slab', item: 'Slab on Ground', description: 'Concrete slab including mesh', unit: 'm²' },
  { id: 'slab-4', section: 'Slab', item: 'Vapor Barrier', description: 'Vapor barrier installation', unit: 'm²' },
  
  // Frame
  { id: 'frame-1', section: 'Frame', item: 'Timber Frame', description: 'Wall framing including studs and plates', unit: 'm²' },
  { id: 'frame-2', section: 'Frame', item: 'Roof Framing', description: 'Roof structure and trusses', unit: 'm²' },
  { id: 'frame-3', section: 'Frame', item: 'Steel Beams', description: 'Structural steel beams', unit: 'm' },
  { id: 'frame-4', section: 'Frame', item: 'Bracing', description: 'Wall and roof bracing', unit: 'LS' },
  
  // External Walls
  { id: 'ext-1', section: 'External Walls', item: 'Brick Veneer', description: 'Face brickwork', unit: 'm²' },
  { id: 'ext-2', section: 'External Walls', item: 'Render', description: 'External render finish', unit: 'm²' },
  { id: 'ext-3', section: 'External Walls', item: 'Cladding', description: 'Weatherboard or sheet cladding', unit: 'm²' },
  { id: 'ext-4', section: 'External Walls', item: 'Insulation', description: 'Wall insulation batts', unit: 'm²' },
  
  // Roof
  { id: 'roof-1', section: 'Roof', item: 'Roof Cover', description: 'Tiles or metal roofing', unit: 'm²' },
  { id: 'roof-2', section: 'Roof', item: 'Sarking', description: 'Roof sarking installation', unit: 'm²' },
  { id: 'roof-3', section: 'Roof', item: 'Gutters & Downpipes', description: 'Rainwater goods', unit: 'm' },
  { id: 'roof-4', section: 'Roof', item: 'Fascias & Soffits', description: 'Eaves lining and fascia', unit: 'm' },
  
  // Internal Walls
  { id: 'int-1', section: 'Internal Walls', item: 'Plasterboard', description: 'Wall and ceiling lining', unit: 'm²' },
  { id: 'int-2', section: 'Internal Walls', item: 'Cornice', description: 'Ceiling cornice', unit: 'm' },
  { id: 'int-3', section: 'Internal Walls', item: 'Insulation', description: 'Ceiling insulation', unit: 'm²' },
  
  // Windows & Doors
  { id: 'window-1', section: 'Windows & Doors', item: 'Windows', description: 'Window supply and installation', unit: 'EA' },
  { id: 'window-2', section: 'Windows & Doors', item: 'External Doors', description: 'External door supply and installation', unit: 'EA' },
  { id: 'window-3', section: 'Windows & Doors', item: 'Internal Doors', description: 'Internal door supply and installation', unit: 'EA' },
  { id: 'window-4', section: 'Windows & Doors', item: 'Hardware', description: 'Door furniture and locks', unit: 'LS' },
  
  // Plumbing
  { id: 'plumb-1', section: 'Plumbing', item: 'Rough-In', description: 'Plumbing rough-in works', unit: 'LS' },
  { id: 'plumb-2', section: 'Plumbing', item: 'Fixtures', description: 'Bathroom and kitchen fixtures', unit: 'LS' },
  { id: 'plumb-3', section: 'Plumbing', item: 'Hot Water System', description: 'Hot water unit supply and install', unit: 'EA' },
  { id: 'plumb-4', section: 'Plumbing', item: 'Drainage', description: 'Stormwater and sewer drainage', unit: 'LS' },
  
  // Electrical
  { id: 'elec-1', section: 'Electrical', item: 'Rough-In', description: 'Electrical rough-in works', unit: 'LS' },
  { id: 'elec-2', section: 'Electrical', item: 'Light Fittings', description: 'Light fitting supply and installation', unit: 'EA' },
  { id: 'elec-3', section: 'Electrical', item: 'Power Points', description: 'Power point installation', unit: 'EA' },
  { id: 'elec-4', section: 'Electrical', item: 'Switchboard', description: 'Main switchboard upgrade', unit: 'EA' },
  
  // Kitchen & Bathrooms
  { id: 'kitchen-1', section: 'Kitchen & Bathrooms', item: 'Kitchen Cabinets', description: 'Kitchen cabinet supply and install', unit: 'LS' },
  { id: 'kitchen-2', section: 'Kitchen & Bathrooms', item: 'Benchtops', description: 'Stone or laminate benchtops', unit: 'm²' },
  { id: 'kitchen-3', section: 'Kitchen & Bathrooms', item: 'Splashback', description: 'Tile or glass splashback', unit: 'm²' },
  { id: 'kitchen-4', section: 'Kitchen & Bathrooms', item: 'Bathroom Vanities', description: 'Vanity supply and installation', unit: 'EA' },
  
  // Flooring
  { id: 'floor-1', section: 'Flooring', item: 'Timber Flooring', description: 'Hardwood or engineered timber', unit: 'm²' },
  { id: 'floor-2', section: 'Flooring', item: 'Carpet', description: 'Carpet supply and installation', unit: 'm²' },
  { id: 'floor-3', section: 'Flooring', item: 'Tiles', description: 'Floor tile supply and installation', unit: 'm²' },
  { id: 'floor-4', section: 'Flooring', item: 'Vinyl', description: 'Vinyl plank or sheet flooring', unit: 'm²' },
  
  // Painting
  { id: 'paint-1', section: 'Painting', item: 'Interior Painting', description: 'Internal walls and ceilings', unit: 'm²' },
  { id: 'paint-2', section: 'Painting', item: 'Exterior Painting', description: 'External walls and trim', unit: 'm²' },
  { id: 'paint-3', section: 'Painting', item: 'Timber Staining', description: 'Staining of timber work', unit: 'm²' },
  
  // Landscaping
  { id: 'land-1', section: 'Landscaping', item: 'Driveways', description: 'Concrete or paved driveway', unit: 'm²' },
  { id: 'land-2', section: 'Landscaping', item: 'Paths & Paving', description: 'Walkways and paved areas', unit: 'm²' },
  { id: 'land-3', section: 'Landscaping', item: 'Fencing', description: 'Boundary and garden fencing', unit: 'm' },
  { id: 'land-4', section: 'Landscaping', item: 'Turfing', description: 'Lawn preparation and turf', unit: 'm²' },
];

interface ConstructionItemSelectorProps {
  selectedItems: string[];
  onSelectionChange: (selectedIds: string[]) => void;
}

export const ConstructionItemSelector: React.FC<ConstructionItemSelectorProps> = ({
  selectedItems,
  onSelectionChange,
}) => {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());

  const sections = Array.from(new Set(BUILDING_SECTIONS.map(item => item.section)));

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  const toggleItem = (itemId: string) => {
    const newSelection = selectedItems.includes(itemId)
      ? selectedItems.filter(id => id !== itemId)
      : [...selectedItems, itemId];
    onSelectionChange(newSelection);
  };

  const toggleAllInSection = (section: string) => {
    const sectionItems = BUILDING_SECTIONS.filter(item => item.section === section);
    const sectionItemIds = sectionItems.map(item => item.id);
    const allSelected = sectionItemIds.every(id => selectedItems.includes(id));

    if (allSelected) {
      onSelectionChange(selectedItems.filter(id => !sectionItemIds.includes(id)));
    } else {
      const newSelection = Array.from(new Set([...selectedItems, ...sectionItemIds]));
      onSelectionChange(newSelection);
    }
  };

  const selectAll = () => {
    onSelectionChange(BUILDING_SECTIONS.map(item => item.id));
  };

  const deselectAll = () => {
    onSelectionChange([]);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Select Items to Quote</CardTitle>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={selectAll}
              className="text-xs text-primary hover:underline"
            >
              Select All
            </button>
            <span className="text-xs text-muted-foreground">|</span>
            <button
              type="button"
              onClick={deselectAll}
              className="text-xs text-primary hover:underline"
            >
              Deselect All
            </button>
          </div>
        </div>
        <p className="text-sm text-muted-foreground mt-2">
          Select the items you want to include in the tender quotation template.
        </p>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-3">
            {sections.map((section) => {
              const sectionItems = BUILDING_SECTIONS.filter(item => item.section === section);
              const sectionItemIds = sectionItems.map(item => item.id);
              const allSelected = sectionItemIds.every(id => selectedItems.includes(id));
              const someSelected = sectionItemIds.some(id => selectedItems.includes(id)) && !allSelected;
              const isExpanded = expandedSections.has(section);

              return (
                <div key={section} className="border rounded-lg p-3">
                  <div className="flex items-center gap-3 mb-2">
                    <Checkbox
                      id={`section-${section}`}
                      checked={allSelected}
                      onCheckedChange={() => toggleAllInSection(section)}
                      className={someSelected ? 'opacity-50' : ''}
                    />
                    <Label
                      htmlFor={`section-${section}`}
                      className="font-semibold text-sm cursor-pointer flex-1"
                      onClick={() => toggleSection(section)}
                    >
                      {section} ({sectionItems.length} items)
                    </Label>
                    <button
                      type="button"
                      onClick={() => toggleSection(section)}
                      className="text-xs text-muted-foreground hover:text-foreground"
                    >
                      {isExpanded ? '▼' : '▶'}
                    </button>
                  </div>
                  
                  {isExpanded && (
                    <div className="ml-6 space-y-2 mt-3">
                      {sectionItems.map((item) => (
                        <div key={item.id} className="flex items-start gap-3 py-1">
                          <Checkbox
                            id={item.id}
                            checked={selectedItems.includes(item.id)}
                            onCheckedChange={() => toggleItem(item.id)}
                          />
                          <div className="flex-1">
                            <Label
                              htmlFor={item.id}
                              className="text-sm cursor-pointer font-medium"
                            >
                              {item.item}
                            </Label>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {item.description} (Unit: {item.unit})
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export { BUILDING_SECTIONS };
