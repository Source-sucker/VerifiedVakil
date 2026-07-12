/**
 * Data ingestion pipeline
 * Parses CSV/JSON/PDF uploads and normalizes into shared data model
 */

let Papa = null; // Will be loaded from CDN

/**
 * Shared data model structure
 */
export const dataModel = {
  gates: [],
  zones: [],
  sensors: [],
  events: [],
  timestamp: null,
  metadata: {}
};

/**
 * Parse uploaded file based on type
 */
export async function ingestFile(file) {
  const fileType = file.name.split('.').pop().toLowerCase();

  try {
    switch (fileType) {
      case 'csv':
        return await parseCSV(file);
      case 'json':
        return await parseJSON(file);
      case 'pdf':
        return await parsePDF(file);
      default:
        throw new Error(`Unsupported file type: ${fileType}`);
    }
  } catch (error) {
    console.error('Ingestion error:', error);
    throw error;
  }
}

/**
 * Parse CSV file using papaparse
 */
async function parseCSV(file) {
  if (!Papa) {
    throw new Error('Papaparse library not loaded');
  }

  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      dynamicTyping: true,
      skipEmptyLines: true,
      complete: (results) => {
        try {
          const normalized = normalizeData(results.data, 'csv');
          resolve({
            success: true,
            data: normalized,
            errors: results.errors,
            rowCount: results.data.length
          });
        } catch (error) {
          reject(error);
        }
      },
      error: (error) => reject(error)
    });
  });
}

/**
 * Parse JSON file
 */
async function parseJSON(file) {
  const text = await file.text();

  try {
    const data = JSON.parse(text);
    const normalized = normalizeData(data, 'json');

    return {
      success: true,
      data: normalized,
      errors: [],
      rowCount: Array.isArray(data) ? data.length : Object.keys(data).length
    };
  } catch (error) {
    throw new Error(`Invalid JSON: ${error.message}`);
  }
}

/**
 * Parse PDF file (text extraction only)
 */
async function parsePDF(file) {
  if (!window.pdfjsLib) {
    throw new Error('PDF.js library not loaded');
  }

  const arrayBuffer = await file.arrayBuffer();
  const pdf = await window.pdfjsLib.getDocument({ data: arrayBuffer }).promise;

  let text = '';
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    text += content.items.map(item => item.str).join(' ') + '\n';
  }

  return {
    success: true,
    data: { text, pages: pdf.numPages },
    errors: [],
    rowCount: pdf.numPages
  };
}

/**
 * Normalize parsed data into shared model
 */
function normalizeData(data, sourceType) {
  const normalized = {
    gates: [],
    zones: [],
    sensors: [],
    events: [],
    timestamp: new Date().toISOString()
  };

  if (sourceType === 'csv' || sourceType === 'json') {
    const array = Array.isArray(data) ? data : [data];

    array.forEach((row, index) => {
      try {
        // Detect row type based on fields
        if (row.gate_id || row.gateId || row.gate) {
          normalized.gates.push(normalizeGate(row));
        } else if (row.zone_id || row.zoneId || row.zone) {
          normalized.zones.push(normalizeZone(row));
        } else if (row.sensor_id || row.sensorId || row.sensor) {
          normalized.sensors.push(normalizeSensor(row));
        } else if (row.event_type || row.eventType || row.type) {
          normalized.events.push(normalizeEvent(row));
        }
      } catch (error) {
        console.warn(`Skipping malformed row ${index}:`, error.message);
      }
    });
  }

  return normalized;
}

/**
 * Normalize gate data
 */
function normalizeGate(row) {
  const id = row.gate_id || row.gateId || row.gate || row.id;
  const capacity = parseFloat(row.capacity || row.max_capacity || 0);
  const current = parseFloat(row.current || row.occupancy || row.count || 0);

  if (!id) throw new Error('Missing gate ID');
  if (capacity <= 0) throw new Error('Invalid capacity');

  return {
    id: String(id),
    capacity,
    current: Math.max(0, current),
    percentage: capacity > 0 ? Math.min(100, (current / capacity) * 100) : 0,
    status: row.status || 'open'
  };
}

/**
 * Normalize zone data
 */
function normalizeZone(row) {
  const id = row.zone_id || row.zoneId || row.zone || row.id;
  const name = row.name || row.zone_name || `Zone ${id}`;

  if (!id) throw new Error('Missing zone ID');

  return {
    id: String(id),
    name: String(name),
    capacity: parseFloat(row.capacity || 0),
    current: parseFloat(row.current || row.occupancy || 0)
  };
}

/**
 * Normalize sensor data
 */
function normalizeSensor(row) {
  const id = row.sensor_id || row.sensorId || row.sensor || row.id;
  const value = parseFloat(row.value || row.reading || 0);

  if (!id) throw new Error('Missing sensor ID');

  return {
    id: String(id),
    type: row.type || row.sensor_type || 'unknown',
    value,
    unit: row.unit || '',
    timestamp: row.timestamp || new Date().toISOString()
  };
}

/**
 * Normalize event data
 */
function normalizeEvent(row) {
  const type = row.event_type || row.eventType || row.type;
  const location = row.location || row.zone || 'unknown';

  if (!type) throw new Error('Missing event type');

  return {
    id: row.id || `event-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    type: String(type),
    location: String(location),
    severity: row.severity || 'low',
    timestamp: row.timestamp || new Date().toISOString(),
    description: row.description || ''
  };
}

/**
 * Validate file size and type before upload
 */
export function validateFile(file) {
  const maxSize = 50 * 1024 * 1024; // 50MB
  const allowedTypes = ['csv', 'json', 'pdf'];
  const fileType = file.name.split('.').pop().toLowerCase();

  if (file.size > maxSize) {
    return { valid: false, error: 'File exceeds 50MB limit' };
  }

  if (!allowedTypes.includes(fileType)) {
    return { valid: false, error: `Unsupported file type. Allowed: ${allowedTypes.join(', ')}` };
  }

  return { valid: true };
}

/**
 * Update global data model with parsed data
 */
export function updateDataModel(parsed) {
  if (!parsed || !parsed.data) return;

  const { gates, zones, sensors, events, timestamp } = parsed.data;

  if (gates && gates.length > 0) {
    dataModel.gates = gates;
  }

  if (zones && zones.length > 0) {
    dataModel.zones = zones;
  }

  if (sensors && sensors.length > 0) {
    dataModel.sensors = sensors;
  }

  if (events && events.length > 0) {
    dataModel.events = [...dataModel.events, ...events];
  }

  if (timestamp) {
    dataModel.timestamp = timestamp;
  }

  // Dispatch custom event for modules to listen
  window.dispatchEvent(new CustomEvent('data-updated', { detail: dataModel }));
}
