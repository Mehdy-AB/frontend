export interface CanvasElement {
  id: string;
  type: 'text' | 'image' | 'icon';
  x: number;
  y: number;
  width?: number;
  height?: number;
  zIndex: number;
  content: string; // HTML for text elements, imageUrl for image elements, icon name for icon elements
  style?: {
    fontSize?: number;
    fontFamily?: string;
    color?: string;
    backgroundColor?: string;
    fontWeight?: string;
    textAlign?: 'left' | 'center' | 'right' | 'justify';
    opacity?: number;
    rotation?: number;
    iconSize?: number; // For icon elements
  };
}

export interface CanvasSettings {
  opacity: number;
  defaultPosition: 'Center' | 'Top-Left' | 'Top-Right' | 'Bottom-Left' | 'Bottom-Right' | 'Custom';
  width: number;
  height: number;
  rotation: number;
  backgroundColor?: string;
  borderColor?: string;
  borderWidth?: number;
  borderStyle?: 'solid' | 'dashed' | 'dotted' | 'double';
  borderRadius?: number;
  pagePlacement?: 'all' | 'first' | 'last' | 'custom'; // Where to apply stamp on document
}

export interface StampEditorState {
  elements: CanvasElement[];
  selectedElementId: string | null;
  canvasSettings: CanvasSettings;
  canvasWidth: number;
  canvasHeight: number;
}

