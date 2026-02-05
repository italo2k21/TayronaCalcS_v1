
import React, { useState, useMemo, useEffect } from 'react';
import { SolarInputs, SolarResults, Appliance, InverterType, BatteryType, QuoteItem, QuoteCategory, SystemAnalysis } from './types';
import { calculateSolarSystem, getSystemAnalysis } from './services/solarMath';
import { getSolarAdvice } from './services/geminiService';
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import {
  Sun,
  Battery,
  Zap,
  MessageSquare,
  Info,
  Tv,
  Wind,
  Refrigerator,
  Wifi,
  Smartphone,
  Lightbulb,
  Plus,
  Trash2,
  Settings,
  ListChecks,
  RefreshCw,
  AirVent,
  WashingMachine,
  Monitor,
  Laptop,
  DollarSign,
  TrendingUp,
  Layout,
  Moon,
  Sparkles,
  PlusCircle,
  FileText,
  Hammer,
  Cable,
  ShieldCheck,
  Package,
  GripHorizontal,
  BoxSelect,
  User,
  MapPin,
  Phone,
  Mail,
  Globe,
  Briefcase,
  CheckCircle2,
  X,
  Award,
  Loader2,
  Camera,
  Coffee,
  UtensilsCrossed,
  Microwave,
  Blend
} from 'lucide-react';

// Imagen enriquecida: Técnico profesional con herramientas instalando sistema solar (Aspecto Premium)
const STATIC_HEADER_IMAGE = "https://images.unsplash.com/photo-1613665813446-82a78c468a1d?auto=format&fit=crop&q=80&w=1200";

const PREDEFINED_APPLIANCES: Omit<Appliance, 'id'>[] = [
  { name: 'Lavadora', power: 500, hours: 1, quantity: 1, icon: 'washing' },
  { name: 'Ventilador', power: 60, hours: 8, quantity: 2, icon: 'wind' },
  { name: 'Aire Acondicionado', power: 1200, hours: 6, quantity: 1, icon: 'airvent' },
  { name: 'Router WiFi', power: 15, hours: 24, quantity: 1, icon: 'wifi' },
  { name: 'Cámara Seguridad', power: 10, hours: 24, quantity: 2, icon: 'camera' },
  { name: 'Cargador Celular', power: 15, hours: 3, quantity: 3, icon: 'smartphone' },
  { name: 'Air Fryer', power: 1500, hours: 0.5, quantity: 1, icon: 'utensils' },
  { name: 'Horno Microondas', power: 1200, hours: 0.5, quantity: 1, icon: 'microwave' },
  { name: 'Licuadora', power: 400, hours: 0.2, quantity: 1, icon: 'blend' },
  { name: 'Nevera/Refri', power: 150, hours: 24, quantity: 1, icon: 'refrigerator' },
  { name: 'Televisor LED', power: 80, hours: 5, quantity: 1, icon: 'tv' },
  { name: 'Bombillos LED', power: 9, hours: 6, quantity: 5, icon: 'lightbulb' },
  { name: 'PC Portátil', power: 60, hours: 6, quantity: 1, icon: 'laptop' },
  { name: 'Cafetera', power: 800, hours: 0.5, quantity: 1, icon: 'coffee' },
];

const AVAILABLE_ICONS = [
  'refrigerator', 'washing', 'tv', 'desktop', 'laptop', 'lightbulb', 'wind', 'wifi', 'smartphone', 'airvent', 'zap', 'camera', 'coffee', 'utensils', 'microwave', 'blend'
];

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'system' | 'load' | 'quote'>('system');
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [showPreview, setShowPreview] = useState(false);
  const [showAppliancePicker, setShowAppliancePicker] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  const [company, setCompany] = useState({
    name: 'Ponte Castello SOLAR',
    expert: 'Italo Gallo Mendonça',
    slogan: 'ENERGÍA SOLAR A TU ALCANCE',
    phone: '304 3449113',
    website: 'italo.gallo@hotmail.com',
    email: 'italo.gallo@hotmail.com'
  });

  const [customer, setCustomer] = useState({
    name: '',
    contact: '',
    email: '',
    city: '',
    address: ''
  });

  const [inputs, setInputs] = useState<SolarInputs>({
    monthlyConsumption: 350,
    peakSunHours: 4.5,
    panelWattage: 450,
    systemVoltage: 24,
    autonomyDays: 1,
    dod: 0.8,
    efficiency: 0.8,
    inverterType: 'hybrid',
    batteryType: 'lithium',
    peakLoadWatts: 0
  });

  const [appliances, setAppliances] = useState<Appliance[]>([
    { id: '1', ...PREDEFINED_APPLIANCES[9] }, // Nevera
    { id: '2', ...PREDEFINED_APPLIANCES[10] }, // TV
    { id: '3', ...PREDEFINED_APPLIANCES[11] }, // Bombillos
  ]);

  const [aiAdvice, setAiAdvice] = useState<string>("");
  const [loadingAdvice, setLoadingAdvice] = useState<boolean>(false);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const cycleApplianceIcon = (id: string) => {
    setAppliances(prev => prev.map(app => {
      if (app.id === id) {
        const currentIndex = AVAILABLE_ICONS.indexOf(app.icon);
        const nextIndex = (currentIndex + 1) % AVAILABLE_ICONS.length;
        return { ...app, icon: AVAILABLE_ICONS[nextIndex] };
      }
      return app;
    }));
  };

  const addAppliance = (predefined: Omit<Appliance, 'id'>) => {
    setAppliances([...appliances, { ...predefined, id: Math.random().toString(36).substr(2, 9) }]);
    setShowAppliancePicker(false);
  };

  const results = useMemo(() => calculateSolarSystem(inputs), [inputs]);
  const systemAnalysis = useMemo(() => getSystemAnalysis(inputs.inverterType, results.inverterSizeWatts), [inputs.inverterType, results.inverterSizeWatts]);
  const totalPeakWatts = useMemo(() => appliances.reduce((acc, app) => acc + (app.power * app.quantity), 0), [appliances]);
  const totalLoadDailyWh = useMemo(() => appliances.reduce((acc, app) => acc + (app.power * app.hours * app.quantity), 0), [appliances]);
  const totalLoadMonthlyKwh = (totalLoadDailyWh * 30) / 1000;

  useEffect(() => {
    setInputs(prev => ({ ...prev, peakLoadWatts: totalPeakWatts }));
  }, [totalPeakWatts]);

  const suggestedInverterPower = useMemo(() => {
    const raw = results.inverterSizeWatts;
    if (raw <= 1000) return 1000;
    if (raw <= 2000) return 2000;
    if (raw <= 3000) return 3000;
    if (raw <= 5000) return 5000;
    if (raw <= 8000) return 8000;
    if (raw <= 10000) return 10000;
    return Math.ceil(raw / 5000) * 5000;
  }, [results.inverterSizeWatts]);

  const autoQuoteItems = useMemo<QuoteItem[]>(() => {
    const panelPrice = 520000;
    const inverterPrice = suggestedInverterPower > 3000 ? 5100000 : 2550000;
    const batteryPrice = inputs.batteryType === 'lithium' ? 5250000 : 1180000;

    return [
      { id: 'p1', description: `Panel Solar ${inputs.panelWattage}W Mono Perc`, quantity: results.numberOfPanels, unitPrice: panelPrice, category: 'panels' },
      { id: 'i1', description: `Inversor ${inputs.inverterType.toUpperCase()} ${suggestedInverterPower}W`, quantity: 1, unitPrice: inverterPrice, category: 'inverters' },
      { id: 'b1', description: `Batería ${inputs.batteryType.toUpperCase()} ${inputs.systemVoltage}V ${results.batteryCapacityAh.toFixed(0)}Ah`, quantity: 1, unitPrice: batteryPrice, category: 'batteries' },
      { id: 'a1', description: 'Estructura de Anclaje (Rack)', quantity: results.numberOfPanels, unitPrice: 135000, category: 'structure' },
      { id: 'c1', description: 'Cableado AC/DC y Protecciones', quantity: 1, unitPrice: 850000, category: 'protection' },
      { id: 'm1', description: 'Mano de Obra e Instalación', quantity: 1, unitPrice: 1500000, category: 'labor' },
    ];
  }, [results, inputs.panelWattage, inputs.inverterType, inputs.batteryType, inputs.systemVoltage, suggestedInverterPower]);

  const activeQuoteItems = autoQuoteItems;
  const quoteTotal = useMemo(() => activeQuoteItems.reduce((acc, item) => acc + (item.quantity * item.unitPrice), 0), [activeQuoteItems]);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(val);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    let newValue: any = value;
    const numericFields = ['monthlyConsumption', 'peakSunHours', 'panelWattage', 'systemVoltage', 'autonomyDays', 'dod', 'efficiency', 'peakLoadWatts'];
    if (e.target.type === 'number' || e.target.type === 'range' || numericFields.includes(name)) {
      newValue = parseFloat(value) || 0;
    }
    setInputs(prev => {
      const updated = { ...prev, [name]: newValue };
      if (name === 'batteryType') {
        if (value === 'lithium') updated.dod = 0.85;
        else if (value === 'gel') updated.dod = 0.6;
        else updated.dod = 0.5;
      }
      return updated;
    });
  };

  const getBase64ImageFromUrl = async (url: string): Promise<string> => {
    const res = await fetch(url);
    const blob = await res.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  const downloadQuotePDF = async () => {
    setIsGeneratingPdf(true);
    try {
      const doc = new jsPDF();
      const date = new Date().toLocaleDateString('es-CO');
      const brandBlue: [number, number, number] = [29, 78, 216];
      const brandAmber: [number, number, number] = [245, 158, 11];

      // --- ENCABEZADO PREMIUM ---
      doc.setFillColor(brandBlue[0], brandBlue[1], brandBlue[2]);
      doc.rect(0, 0, 210, 24, 'F');

      doc.setFontSize(11);
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.text(`PROPUESTA TÉCNICO-COMERCIAL FOTOVOLTAICA`, 14, 15);

      doc.setFontSize(8);
      doc.text(`REF: SOL-ENG-${Math.floor(Math.random() * 9000) + 1000}`, 196, 11, { align: 'right' });
      doc.text(`FECHA DE EMISIÓN: ${date}`, 196, 17, { align: 'right' });

      // --- IMAGEN ENRIQUECIDA PROFESIONAL ---
      try {
        const imgData = await getBase64ImageFromUrl(STATIC_HEADER_IMAGE);

        // Efecto de sombra/marco para la imagen
        doc.setFillColor(240, 240, 240);
        doc.rect(14.5, 33.5, 76, 43, 'F');

        // Imagen del técnico trabajando con herramientas
        doc.addImage(imgData, 'JPEG', 14, 32, 75, 42);

        // Borde fino profesional
        doc.setDrawColor(200, 200, 200);
        doc.setLineWidth(0.3);
        doc.rect(14, 32, 75, 42, 'D');

        doc.setFontSize(6.5);
        doc.setTextColor(140);
        doc.setFont("helvetica", "italic");
        doc.text("Instalación certificada por expertos de Ponte Castello.", 14, 78);
      } catch (e) {
        doc.setFillColor(245, 245, 245);
        doc.roundedRect(14, 32, 75, 42, 2, 2, 'F');
      }

      // --- INFO CORPORATIVA ---
      const companyX = 95;
      doc.setFontSize(20);
      doc.setTextColor(brandBlue[0], brandBlue[1], brandBlue[2]);
      doc.setFont("helvetica", "bold");
      doc.text(company.name.toUpperCase(), companyX, 42);

      doc.setFontSize(10);
      doc.setTextColor(brandAmber[0], brandAmber[1], brandAmber[2]);
      doc.setFont("helvetica", "bold");
      doc.text(company.slogan, companyX, 49);

      doc.setFontSize(8.5);
      doc.setTextColor(70);
      doc.setFont("helvetica", "normal");
      const intro = "Soluciones energéticas sostenibles diseñadas con la máxima precisión técnica para garantizar independencia eléctrica y rentabilidad a largo plazo.";
      const splitIntro = doc.splitTextToSize(intro, 100);
      doc.text(splitIntro, companyX, 55);

      // --- SECCIÓN DE CONTACTO Y CLIENTE ---
      const contactY = 95;
      doc.setFillColor(249, 250, 251);
      doc.roundedRect(14, contactY - 5, 182, 36, 1.5, 1.5, 'F');

      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(30, 41, 59);
      doc.text("CONSULTOR TÉCNICO:", 20, contactY + 3);

      doc.setFontSize(8.5);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(71, 85, 105);
      doc.text(`ID Experto: ${company.expert}`, 20, contactY + 9);
      doc.text(`Tel/WA: ${company.phone}`, 20, contactY + 14);
      doc.text(`E-mail: ${company.email}`, 20, contactY + 19);

      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(30, 41, 59);
      doc.text("CLIENTE BENEFICIARIO:", 115, contactY + 3);

      doc.setFontSize(8.5);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(71, 85, 105);
      doc.text(`Nombre: ${customer.name || 'CLIENTE POTENCIAL'}`, 115, contactY + 9);
      doc.text(`Ubicación: ${customer.city || 'NO ESPECIFICADA'}`, 115, contactY + 14);
      doc.text(`Referencia: Propuesta HelioCalc Pro`, 115, contactY + 19);

      // --- TABLA DE INGENIERÍA ---
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(15, 23, 42);
      doc.text("ESPECIFICACIONES DEL DISEÑO SOLAR:", 14, 138);

      autoTable(doc, {
        startY: 143,
        head: [['Componente / Parámetro', 'Valor Calculado']],
        body: [
          ['Módulos Fotovoltaicos', `${results.numberOfPanels} Paneles de ${inputs.panelWattage}W (Tier 1)`],
          ['Potencia Pico del Arreglo', `${(results.numberOfPanels * inputs.panelWattage / 1000).toFixed(2)} kWp`],
          ['Capacidad de Inversión', `${suggestedInverterPower}W (${inputs.inverterType.toUpperCase()})`],
          ['Respaldo Energético Ah', `${results.batteryCapacityAh.toFixed(0)} Ah @ ${inputs.systemVoltage}V`],
          ['Generación Mensual Est.', `${results.monthlyProduction.toFixed(1)} kWh/mes`],
          ['Ahorro en Emisiones CO2', `${(results.monthlyProduction * 0.45).toFixed(1)} kg/mes`],
        ],
        theme: 'striped',
        headStyles: { fillColor: brandAmber, textColor: [0, 0, 0], fontSize: 9 },
        styles: { fontSize: 8.5, cellPadding: 3 }
      });

      // --- TABLA DE PRESUPUESTO ---
      const budgetY = (doc as any).lastAutoTable.finalY + 10;
      doc.text("VALORACIÓN ECONÓMICA DEL PROYECTO:", 14, budgetY);

      autoTable(doc, {
        startY: budgetY + 4,
        head: [['Ítem de Suministro', 'Cant.', 'V. Unitario', 'Subtotal']],
        body: activeQuoteItems.map(i => [
          i.description,
          i.quantity,
          formatCurrency(i.unitPrice),
          formatCurrency(i.quantity * i.unitPrice)
        ]),
        theme: 'grid',
        headStyles: { fillColor: brandBlue, textColor: [255, 255, 255], fontSize: 9 },
        styles: { fontSize: 8.5, cellPadding: 3 }
      });

      // --- TOTALIZACIÓN ---
      const finalPriceY = (doc as any).lastAutoTable.finalY + 8;
      const labelX = 145;
      const valueX = 196;

      doc.setFontSize(9);
      doc.setTextColor(100);
      doc.text("Subtotal Neto:", labelX, finalPriceY);
      doc.text(formatCurrency(quoteTotal), valueX, finalPriceY, { align: 'right' });

      doc.text("Impuestos (IVA 19%):", labelX, finalPriceY + 6);
      doc.text(formatCurrency(quoteTotal * 0.19), valueX, finalPriceY + 6, { align: 'right' });

      doc.setFillColor(brandBlue[0], brandBlue[1], brandBlue[2]);
      doc.roundedRect(labelX - 3, finalPriceY + 10, 58, 16, 1, 1, 'F');

      doc.setFontSize(9);
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.text("INVERSIÓN FINAL", labelX + 2, finalPriceY + 16);
      doc.setFontSize(12);
      doc.text(formatCurrency(quoteTotal * 1.19), valueX - 2, finalPriceY + 22, { align: 'right' });

      doc.setFontSize(7.5);
      doc.setTextColor(140);
      doc.setFont("helvetica", "normal");
      doc.text("Nota: Los precios están sujetos a cambios según TRM y disponibilidad de stock.", 14, 280);
      doc.text("Este documento es una cotización preliminar y no constituye un contrato final.", 14, 284);

      // === NUEVA PÁGINA: ANÁLISIS TÉCNICO DEL SISTEMA ===
      doc.addPage();

      // Encabezado de la página de análisis
      doc.setFillColor(brandBlue[0], brandBlue[1], brandBlue[2]);
      doc.rect(0, 0, 210, 24, 'F');

      doc.setFontSize(11);
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.text(`ANÁLISIS TÉCNICO - SISTEMA ${inputs.inverterType.toUpperCase()}`, 14, 15);

      doc.setFontSize(8);
      doc.text(`Eficiencia Estimada: ${Math.round(systemAnalysis.estimatedEfficiency * 100)}%`, 196, 15, { align: 'right' });

      // Descripción del sistema
      let analysisY = 35;

      // Indicadores de requisitos
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(15, 23, 42);
      doc.text("REQUISITOS DEL SISTEMA:", 14, analysisY);

      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(70);
      analysisY += 8;
      doc.text(`• Conexión a Red: ${systemAnalysis.requiresGridConnection ? 'Requerida' : 'No necesaria'}`, 20, analysisY);
      analysisY += 6;
      doc.text(`• Banco de Baterías: ${systemAnalysis.requiresBatteries ? 'Requerido' : 'No requerido'}`, 20, analysisY);
      analysisY += 6;
      doc.text(`• Eficiencia Global Estimada: ${Math.round(systemAnalysis.estimatedEfficiency * 100)}%`, 20, analysisY);

      // Ventajas
      analysisY += 14;
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(22, 163, 74); // Verde
      doc.text("VENTAJAS DEL SISTEMA:", 14, analysisY);

      doc.setFontSize(8.5);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(70);
      systemAnalysis.pros.forEach((pro, i) => {
        analysisY += 6;
        doc.text(`✓ ${pro}`, 20, analysisY);
      });

      // Consideraciones
      analysisY += 12;
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(220, 38, 38); // Rojo
      doc.text("CONSIDERACIONES:", 14, analysisY);

      doc.setFontSize(8.5);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(70);
      systemAnalysis.cons.forEach((con, i) => {
        analysisY += 6;
        doc.text(`• ${con}`, 20, analysisY);
      });

      // Ideal para
      analysisY += 12;
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(79, 70, 229); // Indigo
      doc.text("IDEAL PARA:", 14, analysisY);

      doc.setFontSize(8.5);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(70);
      systemAnalysis.idealFor.forEach((item, i) => {
        analysisY += 6;
        doc.text(`→ ${item}`, 20, analysisY);
      });

      // Tabla de Inversores Recomendados
      analysisY += 14;
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(15, 23, 42);
      doc.text("INVERSORES RECOMENDADOS:", 14, analysisY);

      autoTable(doc, {
        startY: analysisY + 4,
        head: [['Marca', 'Modelo', 'Potencia', 'Características', 'Precio Ref.']],
        body: systemAnalysis.inverterRecommendations.slice(0, 4).map(inv => [
          inv.brand,
          inv.model,
          `${inv.power}W`,
          inv.features.slice(0, 2).join(', '),
          inv.priceRange
        ]),
        theme: 'striped',
        headStyles: { fillColor: brandAmber, textColor: [0, 0, 0], fontSize: 8 },
        styles: { fontSize: 7.5, cellPadding: 2 },
        columnStyles: {
          0: { cellWidth: 25 },
          1: { cellWidth: 35 },
          2: { cellWidth: 20 },
          3: { cellWidth: 55 },
          4: { cellWidth: 35 }
        }
      });

      // Nota al pie
      const noteY = (doc as any).lastAutoTable.finalY + 15;
      doc.setFillColor(245, 245, 245);
      doc.roundedRect(14, noteY, 182, 20, 2, 2, 'F');

      doc.setFontSize(7);
      doc.setTextColor(100);
      doc.setFont("helvetica", "italic");
      doc.text("Este análisis es generado automáticamente por HelioCalc Pro basado en los parámetros técnicos ingresados.", 20, noteY + 7);
      doc.text("Los precios de referencia están sujetos a variaciones del mercado y TRM. Consulte disponibilidad actual.", 20, noteY + 13);

      doc.save(`Propuesta_Solar_${customer.name || 'Cliente'}.pdf`);
      setShowPreview(false);
    } catch (error) {
      console.error("Error en PDF:", error);
      alert("Hubo un problema cargando la imagen profesional. Intente nuevamente.");
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const getAppIcon = (iconName: string) => {
    switch (iconName) {
      case 'refrigerator': return <Refrigerator size={24} />;
      case 'washing': return <WashingMachine size={24} />;
      case 'tv': return <Tv size={24} />;
      case 'desktop': return <Monitor size={24} />;
      case 'laptop': return <Laptop size={24} />;
      case 'lightbulb': return <Lightbulb size={24} />;
      case 'wind': return <Wind size={24} />;
      case 'wifi': return <Wifi size={24} />;
      case 'smartphone': return <Smartphone size={24} />;
      case 'airvent': return <AirVent size={24} />;
      case 'camera': return <Camera size={24} />;
      case 'coffee': return <Coffee size={24} />;
      case 'utensils': return <UtensilsCrossed size={24} />;
      case 'microwave': return <Microwave size={24} />;
      case 'blend': return <Blend size={24} />;
      default: return <Zap size={24} />;
    }
  };

  const getApplianceColorClasses = (icon: string) => {
    switch (icon) {
      case 'lightbulb': return "bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400";
      case 'refrigerator':
      case 'airvent': return "bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400";
      case 'washing':
      case 'wind': return "bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400";
      default: return "bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-400";
    }
  }

  const getCategoryIcon = (category: QuoteCategory) => {
    switch (category) {
      case 'panels': return <Sun size={20} className="text-amber-500" />;
      case 'inverters': return <Zap size={20} className="text-blue-500" />;
      case 'batteries': return <Battery size={20} className="text-emerald-500" />;
      case 'structure': return <GripHorizontal size={20} className="text-slate-500" />;
      case 'wiring': return <Cable size={20} className="text-orange-500" />;
      case 'protection': return <ShieldCheck size={20} className="text-red-500" />;
      case 'labor': return <Hammer size={20} className="text-indigo-500" />;
      default: return <Package size={20} />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors duration-300">

      <header className="bg-white/80 dark:bg-slate-900/90 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800 sticky top-0 z-50 px-6 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-tr from-blue-700 to-blue-500 rounded-xl shadow-lg">
            <Award className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-xl font-bold tracking-tight">Ponte<span className="text-blue-600">Castello</span></h1>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setIsDarkMode(!isDarkMode)} className="p-2 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-all">
            {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto px-4 py-6 mb-24 max-w-2xl mx-auto w-full text-slate-800 dark:text-slate-200">

        {activeTab === 'system' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="grid grid-cols-2 gap-3">
              <SummaryMiniCard label="Paneles" value={results.numberOfPanels} sub={inputs.panelWattage + "W"} icon={<Sun size={16} />} color="amber" />
              <SummaryMiniCard label="Baterías" value={results.batteryCapacityAh.toFixed(0) + "Ah"} sub={inputs.systemVoltage + "V"} icon={<Battery size={16} />} color="emerald" />
              <SummaryMiniCard label="Inversor" value={suggestedInverterPower + "W"} sub={inputs.inverterType} icon={<Zap size={16} />} color="blue" />
              <SummaryMiniCard label="Producción" value={results.monthlyProduction.toFixed(0)} sub="kWh/mes" icon={<TrendingUp size={16} />} color="indigo" />
            </div>

            <section className="bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-800 rounded-[2rem] p-6 border-2 border-slate-200 dark:border-slate-700 shadow-lg shadow-slate-200/50 dark:shadow-slate-900/50 space-y-6">
              <h2 className="text-xs font-black text-slate-400 dark:text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <Settings size={14} /> Ingeniería del Sistema
              </h2>
              <SliderControl label="Consumo Mensual" value={inputs.monthlyConsumption} min={50} max={1000} unit="kWh" name="monthlyConsumption" onChange={handleInputChange} />
              <SliderControl label="Eficiencia del Sistema" value={inputs.efficiency} min={0.5} max={0.95} step={0.01} unit="%" name="efficiency" onChange={handleInputChange} isPercentage />
              <div className="grid grid-cols-2 gap-4">
                <SelectControl label="Tipo Inversor" name="inverterType" value={inputs.inverterType} onChange={handleInputChange} options={[{ v: 'hybrid', l: 'Híbrido' }, { v: 'off-grid', l: 'Off-Grid' }, { v: 'on-grid', l: 'On-Grid' }]} />
                <SelectControl label="Potencia Panel" name="panelWattage" value={inputs.panelWattage.toString()} onChange={handleInputChange} options={[300, 450, 550, 670].map(w => ({ v: w.toString(), l: `${w}W` }))} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <InputControl label="Voltaje (V)" name="systemVoltage" value={inputs.systemVoltage} onChange={handleInputChange} />
                <InputControl label="Horas Sol" name="peakSunHours" value={inputs.peakSunHours} onChange={handleInputChange} />
              </div>
            </section>

            <button
              onClick={() => { setLoadingAdvice(true); getSolarAdvice(inputs, results).then(res => { setAiAdvice(res); setLoadingAdvice(false); }) }}
              className="w-full bg-blue-700 text-white py-4 rounded-3xl font-black flex items-center justify-center gap-2 shadow-xl active:scale-95 transition-all"
            >
              {loadingAdvice ? <RefreshCw className="animate-spin" /> : <MessageSquare />}
              {loadingAdvice ? "Analizando..." : "Análisis Técnico IA"}
            </button>

            {aiAdvice && (
              <div className="bg-amber-500/10 border border-amber-500/20 p-6 rounded-[2rem] text-sm leading-relaxed text-amber-800 dark:text-amber-200 animate-in zoom-in-95 duration-300">
                <span className="font-black text-amber-600 dark:text-amber-400 block mb-2">ASESORÍA TÉCNICA:</span>
                {aiAdvice}
              </div>
            )}

            {/* PANEL DE ANÁLISIS DEL SISTEMA */}
            <section className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-slate-900 dark:to-slate-800 rounded-[2rem] p-6 border-2 border-blue-200 dark:border-slate-700 shadow-lg shadow-blue-200/50 dark:shadow-slate-900/50 space-y-5">
              <h2 className="text-xs font-black text-slate-400 dark:text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <Info size={14} /> Análisis del Sistema {inputs.inverterType.toUpperCase()}
              </h2>

              {/* Información del tipo de sistema */}
              <div className="grid grid-cols-2 gap-3">
                <div className={`p-4 rounded-2xl ${systemAnalysis.requiresGridConnection ? 'bg-blue-500/10 border border-blue-500/20' : 'bg-slate-100 dark:bg-slate-800'}`}>
                  <span className="text-[9px] font-black uppercase text-slate-400">Conexión Red</span>
                  <p className="font-bold text-sm">{systemAnalysis.requiresGridConnection ? '✅ Requerida' : '❌ No necesaria'}</p>
                </div>
                <div className={`p-4 rounded-2xl ${systemAnalysis.requiresBatteries ? 'bg-emerald-500/10 border border-emerald-500/20' : 'bg-slate-100 dark:bg-slate-800'}`}>
                  <span className="text-[9px] font-black uppercase text-slate-400">Baterías</span>
                  <p className="font-bold text-sm">{systemAnalysis.requiresBatteries ? '🔋 Requeridas' : '⚡ Sin baterías'}</p>
                </div>
              </div>

              {/* Eficiencia estimada */}
              <div className="bg-gradient-to-r from-blue-500/10 to-indigo-500/10 p-4 rounded-2xl border border-blue-500/20">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-black uppercase text-slate-500">Eficiencia Estimada</span>
                  <span className="text-xl font-black text-blue-600">{Math.round(systemAnalysis.estimatedEfficiency * 100)}%</span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 mt-2">
                  <div
                    className="bg-gradient-to-r from-blue-500 to-indigo-600 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${systemAnalysis.estimatedEfficiency * 100}%` }}
                  />
                </div>
              </div>

              {/* Pros y Contras */}
              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-emerald-500/5 border border-emerald-500/20 p-4 rounded-2xl space-y-2">
                  <h4 className="text-[10px] font-black uppercase text-emerald-600 dark:text-emerald-400">✅ Ventajas</h4>
                  <ul className="space-y-1">
                    {systemAnalysis.pros.slice(0, 4).map((pro, i) => (
                      <li key={i} className="text-[11px] text-slate-600 dark:text-slate-300">• {pro}</li>
                    ))}
                  </ul>
                </div>
                <div className="bg-red-500/5 border border-red-500/20 p-4 rounded-2xl space-y-2">
                  <h4 className="text-[10px] font-black uppercase text-red-600 dark:text-red-400">⚠️ Consideraciones</h4>
                  <ul className="space-y-1">
                    {systemAnalysis.cons.slice(0, 3).map((con, i) => (
                      <li key={i} className="text-[11px] text-slate-600 dark:text-slate-300">• {con}</li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Ideal para */}
              <div className="bg-indigo-500/5 border border-indigo-500/20 p-4 rounded-2xl space-y-2">
                <h4 className="text-[10px] font-black uppercase text-indigo-600 dark:text-indigo-400">🎯 Ideal para</h4>
                <div className="flex flex-wrap gap-2">
                  {systemAnalysis.idealFor.map((item, i) => (
                    <span key={i} className="text-[10px] bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 px-2 py-1 rounded-full">
                      {item}
                    </span>
                  ))}
                </div>
              </div>

              {/* Inversores Recomendados */}
              <div className="space-y-3">
                <h4 className="text-[10px] font-black uppercase text-slate-400">⚡ Inversores Recomendados</h4>
                <div className="space-y-3">
                  {systemAnalysis.inverterRecommendations.slice(0, 3).map((inv, i) => (
                    <div key={i} className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-700 hover:border-blue-500/30 transition-all">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-black text-sm">{inv.brand} <span className="text-blue-600">{inv.model}</span></p>
                          <p className="text-[10px] text-slate-400">{inv.power}W • {inv.type.toUpperCase()}</p>
                        </div>
                        <span className="text-[9px] font-bold bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 px-2 py-1 rounded-full">
                          {inv.priceRange}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {inv.features.map((feat, j) => (
                          <span key={j} className="text-[8px] bg-slate-200 dark:bg-slate-700 px-2 py-0.5 rounded-full text-slate-600 dark:text-slate-300">
                            {feat}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          </div>
        )}

        {activeTab === 'load' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex justify-between items-center px-2">
              <h2 className="text-xl font-bold">Censo de Carga</h2>
              <button
                onClick={() => setShowAppliancePicker(true)}
                className="bg-blue-600 text-white p-3 rounded-2xl shadow-lg active:scale-90 transition-all flex items-center gap-1 px-4"
              >
                <Plus size={20} /> Equipo
              </button>
            </div>

            <div className="space-y-3 bg-white/50 dark:bg-slate-900/50 p-4 rounded-[2.5rem] border-2 border-slate-200 dark:border-slate-800 shadow-inner">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-2 mb-2">Lista de Equipos</h3>
              {appliances.map(app => (
                <div key={app.id} className="bg-white dark:bg-slate-800 p-4 rounded-3xl border border-slate-200 dark:border-slate-700 flex items-center gap-4 group shadow-sm hover:shadow-md transition-shadow">
                  <button
                    onClick={() => cycleApplianceIcon(app.id)}
                    className={`p-4 rounded-full shadow-inner transition-all hover:scale-105 active:scale-95 ${getApplianceColorClasses(app.icon)}`}
                  >
                    {getAppIcon(app.icon)}
                  </button>
                  <div className="flex-1">
                    <input value={app.name} onChange={e => setAppliances(appliances.map(a => a.id === app.id ? { ...a, name: e.target.value } : a))} className="bg-transparent border-none font-bold text-slate-900 dark:text-slate-100 outline-none w-full" />
                    <div className="flex gap-4 mt-1">
                      <div className="flex flex-col">
                        <span className="text-[8px] text-slate-500 dark:text-slate-400 uppercase font-black tracking-widest">Watts</span>
                        <input type="number" value={app.power} onChange={e => setAppliances(appliances.map(a => a.id === app.id ? { ...a, power: parseInt(e.target.value) || 0 } : a))} className="bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-2 w-16 text-[11px] font-bold" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[8px] text-slate-500 dark:text-slate-400 uppercase font-black tracking-widest">Hrs/Día</span>
                        <input type="number" value={app.hours} onChange={e => setAppliances(appliances.map(a => a.id === app.id ? { ...a, hours: parseFloat(e.target.value) || 0 } : a))} className="bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-2 w-12 text-[11px] font-bold" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[8px] text-slate-500 dark:text-slate-400 uppercase font-black tracking-widest">Cant</span>
                        <input type="number" value={app.quantity} onChange={e => setAppliances(appliances.map(a => a.id === app.id ? { ...a, quantity: parseInt(e.target.value) || 1 } : a))} className="bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-2 w-10 text-[11px] font-bold" />
                      </div>
                    </div>
                  </div>
                  <button onClick={() => setAppliances(appliances.filter(a => a.id !== app.id))} className="text-slate-400 hover:text-red-500 transition-colors p-2">
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}
            </div>

            <div className="bg-blue-700 p-8 rounded-[2.5rem] shadow-2xl text-center space-y-4">
              <p className="text-blue-100 text-xs font-black uppercase tracking-widest opacity-80">Consumo a Respaldar</p>
              <h3 className="text-5xl font-black text-white">{totalLoadMonthlyKwh.toFixed(1)} <span className="text-xl font-medium opacity-60">kWh/mes</span></h3>
              <button
                onClick={() => { setInputs({ ...inputs, monthlyConsumption: Math.round(totalLoadMonthlyKwh) }); setActiveTab('system'); }}
                className="bg-white text-blue-700 px-6 py-3 rounded-2xl font-black text-sm hover:bg-blue-50 transition-all shadow-lg"
              >
                Sincronizar Ingeniería
              </button>
            </div>
          </div>
        )}

        {activeTab === 'quote' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10">
            <section className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-slate-900 dark:to-slate-800 rounded-[2rem] p-6 border-2 border-amber-200 dark:border-amber-900/30 shadow-lg shadow-amber-200/20 dark:shadow-slate-950 space-y-4">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <Briefcase size={14} /> Marca: Ponte Castello
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <InputWithIcon icon={<Award size={16} />} placeholder="Nombre de Empresa" value={company.name} onChange={v => setCompany({ ...company, name: v })} />
                <InputWithIcon icon={<User size={16} />} placeholder="Experto a Cargo" value={company.expert} onChange={v => setCompany({ ...company, expert: v })} />
                <InputWithIcon icon={<Phone size={16} />} placeholder="Whatsapp" value={company.phone} onChange={v => setCompany({ ...company, phone: v })} />
                <InputWithIcon icon={<Mail size={16} />} placeholder="Email corporativo" value={company.email} onChange={v => setCompany({ ...company, email: v })} />
              </div>
            </section>

            <div className="bg-gradient-to-br from-slate-50 to-white dark:from-slate-900 dark:to-slate-800 rounded-[2rem] p-6 border-2 border-slate-200 dark:border-slate-800 shadow-lg shadow-slate-200/50 dark:shadow-slate-950 space-y-4">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <User size={14} /> Datos del Cliente
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <InputWithIcon icon={<User size={18} />} placeholder="Nombre del Solicitante" value={customer.name} onChange={v => setCustomer({ ...customer, name: v })} />
                <InputWithIcon icon={<Globe size={18} />} placeholder="Ciudad" value={customer.city} onChange={v => setCustomer({ ...customer, city: v })} />
                <InputWithIcon icon={<MapPin size={18} />} placeholder="Dirección del Proyecto" value={customer.address} onChange={v => setCustomer({ ...customer, address: v })} />
              </div>
            </div>

            <div className="bg-blue-600/10 border border-blue-200 dark:border-blue-500/30 p-8 rounded-[2.5rem] text-center shadow-sm">
              <p className="text-blue-600 dark:text-blue-400 text-xs font-black uppercase tracking-widest mb-1">Inversión Final Sugerida (IVA 19%)</p>
              <h3 className="text-4xl font-black text-slate-900 dark:text-slate-50 mb-6">{formatCurrency(quoteTotal * 1.19)}</h3>
              <button
                onClick={() => setShowPreview(true)}
                className="px-8 py-4 rounded-3xl font-black text-sm flex items-center justify-center gap-2 mx-auto shadow-lg active:scale-95 transition-all bg-blue-700 text-white"
              >
                <FileText size={18} /> Revisar Propuesta Final
              </button>
            </div>

            <div className="bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-800 rounded-[2.5rem] p-6 border-2 border-slate-200 dark:border-slate-800 space-y-4 shadow-xl shadow-slate-200/50 dark:shadow-slate-950 min-h-[300px]">
              <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest">LISTA DE MATERIALES Y SERVICIOS</h2>
              <div className="space-y-4">
                {activeQuoteItems.map(item => (
                  <div key={item.id} className="bg-slate-50 dark:bg-slate-800/30 p-4 rounded-3xl border border-slate-100 dark:border-slate-800 flex items-center gap-4 group">
                    <div className="p-3 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">{getCategoryIcon(item.category as QuoteCategory)}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold truncate">{item.description}</p>
                      <p className="text-[10px] text-slate-400 font-black">{item.quantity} × {formatCurrency(item.unitPrice)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-black">{formatCurrency(item.quantity * item.unitPrice)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Selector de Electrodomésticos */}
      {showAppliancePicker && (
        <div className="fixed inset-0 z-[100] bg-slate-950/80 backdrop-blur-md p-4 flex items-end justify-center animate-in slide-in-from-bottom-20 duration-300">
          <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
              <h2 className="text-lg font-black uppercase tracking-tight">Agregar Equipo</h2>
              <button onClick={() => setShowAppliancePicker(false)} className="p-2 bg-slate-100 dark:bg-slate-800 rounded-full transition-colors"><X size={20} /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 grid grid-cols-2 sm:grid-cols-3 gap-4">
              {PREDEFINED_APPLIANCES.map((app, idx) => (
                <button
                  key={idx}
                  onClick={() => addAppliance(app)}
                  className="flex flex-col items-center gap-3 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-3xl border border-slate-100 dark:border-slate-800 hover:border-blue-500/50 transition-all hover:scale-[1.02] active:scale-95 group"
                >
                  <div className={`p-4 rounded-full shadow-inner transition-all ${getApplianceColorClasses(app.icon)} group-hover:bg-blue-600 group-hover:text-white`}>
                    {getAppIcon(app.icon)}
                  </div>
                  <div className="text-center">
                    <p className="text-[11px] font-black uppercase tracking-tight truncate w-full">{app.name}</p>
                    <p className="text-[9px] font-bold text-slate-400">{app.power}W</p>
                  </div>
                </button>
              ))}
              <button
                onClick={() => addAppliance({ name: 'Otro Equipo', power: 100, hours: 4, quantity: 1, icon: 'zap' })}
                className="flex flex-col items-center justify-center gap-3 p-4 bg-blue-600/5 border border-blue-500/20 rounded-3xl hover:bg-blue-600 transition-all group"
              >
                <PlusCircle size={32} className="text-blue-600 group-hover:text-white" />
                <p className="text-[11px] font-black uppercase text-blue-600 group-hover:text-white">Manual</p>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Previsualización */}
      {showPreview && (
        <div className="fixed inset-0 z-[100] bg-slate-950/80 backdrop-blur-md p-4 flex items-center justify-center animate-in fade-in duration-300">
          <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[95vh]">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-blue-700 text-white">
              <div className="flex items-center gap-3">
                <Award size={24} />
                <div>
                  <h2 className="text-lg font-black uppercase">Propuesta HelioCalc</h2>
                </div>
              </div>
              <button onClick={() => setShowPreview(false)} className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors"><X size={20} /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              <div className="relative aspect-video rounded-[2rem] overflow-hidden bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                <img src={STATIC_HEADER_IMAGE} className="w-full h-full object-cover" alt="Técnico Solar Profesional" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <h4 className="text-[8px] font-black text-slate-400 uppercase tracking-widest">EMPRESA</h4>
                  <p className="text-[11px] font-bold">{company.name}</p>
                </div>
                <div className="space-y-1 text-right border-l pl-4">
                  <h4 className="text-[8px] font-black text-slate-400 uppercase tracking-widest">CLIENTE</h4>
                  <p className="text-[11px] font-bold">{customer.name || 'CLIENTE'}</p>
                </div>
              </div>
            </div>
            <div className="p-6 bg-slate-900 text-white space-y-4">
              <button
                onClick={downloadQuotePDF}
                disabled={isGeneratingPdf}
                className="w-full bg-blue-600 py-4 rounded-2xl font-black flex items-center justify-center gap-2"
              >
                {isGeneratingPdf ? <RefreshCw className="animate-spin" size={18} /> : <FileText size={18} />}
                {isGeneratingPdf ? "PROCESANDO..." : "DESCARGAR PDF PROFESIONAL"}
              </button>
            </div>
          </div>
        </div>
      )}

      <nav className="fixed bottom-0 left-0 right-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl border-t border-slate-200 dark:border-slate-800 px-6 pt-3 pb-8 flex justify-around items-center z-50 shadow-2xl transition-colors">
        <NavButton active={activeTab === 'system'} onClick={() => setActiveTab('system')} icon={<Layout size={24} />} label="Sistema" />
        <NavButton active={activeTab === 'load'} onClick={() => setActiveTab('load')} icon={<ListChecks size={24} />} label="Cargas" />
        <NavButton active={activeTab === 'quote'} onClick={() => setActiveTab('quote')} icon={<DollarSign size={24} />} label="Precio" />
      </nav>
    </div>
  );
};

const InputWithIcon: React.FC<{ icon?: React.ReactNode, placeholder: string, value: string, onChange: (v: string) => void, type?: string }> = ({ icon, placeholder, value, onChange, type = "text" }) => (
  <div className="flex items-center gap-3 bg-white dark:bg-slate-800 p-1 rounded-2xl border border-slate-300 dark:border-slate-700/50 focus-within:ring-2 focus-within:ring-blue-500/30 shadow-sm transition-all">
    {icon && <div className="p-3 text-blue-600">{icon}</div>}
    <input type={type} placeholder={placeholder} value={value} onChange={e => onChange(e.target.value)} className={`bg-transparent border-none outline-none w-full font-bold text-sm ${!icon ? 'px-4 py-3' : ''}`} />
  </div>
);

const NavButton: React.FC<{ active: boolean, onClick: () => void, icon: React.ReactNode, label: string }> = ({ active, onClick, icon, label }) => (
  <button onClick={onClick} className={`flex flex-col items-center gap-1 transition-all duration-300 ${active ? 'text-blue-600 dark:text-blue-400 scale-110' : 'text-slate-500 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}>
    <div className={`p-2 rounded-2xl transition-colors ${active ? 'bg-blue-500/10' : ''}`}>
      {icon}
    </div>
    <span className="text-[9px] font-black uppercase tracking-tighter">{label}</span>
  </button>
);

const SummaryMiniCard: React.FC<{ label: string, value: string | number, sub: string, icon: React.ReactNode, color: 'blue' | 'emerald' | 'amber' | 'indigo' }> = ({ label, value, sub, icon, color }) => {
  const themes = {
    blue: "from-blue-50 to-indigo-50 border-blue-200 dark:from-blue-900/20 dark:to-indigo-900/20 dark:border-blue-800",
    emerald: "from-emerald-50 to-teal-50 border-emerald-200 dark:from-emerald-900/20 dark:to-teal-900/20 dark:border-emerald-800",
    amber: "from-amber-50 to-orange-50 border-amber-200 dark:from-amber-900/20 dark:to-orange-900/20 dark:border-amber-800",
    indigo: "from-indigo-50 to-violet-50 border-indigo-200 dark:from-indigo-900/20 dark:to-violet-900/20 dark:border-indigo-800"
  };
  return (
    <div className={`bg-white dark:bg-slate-900 bg-gradient-to-br ${themes[color]} p-4 rounded-3xl border-2 shadow-md flex flex-col gap-1 transition-all hover:shadow-lg`}>
      <div className="flex items-center gap-2 opacity-70">
        {icon}
        <span className="text-[9px] font-black uppercase tracking-widest">{label}</span>
      </div>
      <p className="text-xl font-black text-slate-900 dark:text-slate-100">{value}</p>
      <p className="text-[10px] font-bold italic text-slate-500 dark:text-slate-400">{sub}</p>
    </div>
  );
};

const SliderControl: React.FC<{ label: string, value: number, min: number, max: number, step?: number, unit: string, name: string, onChange: any, isPercentage?: boolean }> = ({ label, value, min, max, step = 1, unit, name, onChange, isPercentage }) => {
  const displayValue = isPercentage ? Math.round(value * 100) : value;
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center px-1">
        <label className="text-[10px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-wider">{label}</label>
        <span className="text-xs font-black text-blue-600 dark:text-blue-400 bg-blue-500/10 px-3 py-1 rounded-full border border-blue-500/20">
          {displayValue}{unit}
        </span>
      </div>
      <input type="range" name={name} min={min} max={max} step={step} value={value} onChange={onChange} className="w-full cursor-pointer accent-blue-600" />
    </div>
  );
};

const SelectControl: React.FC<{ label: string, name: string, value: string, options: any[], onChange: any }> = ({ label, name, value, options, onChange }) => (
  <div className="flex flex-col gap-2">
    <label className="text-[9px] font-black text-slate-600 dark:text-slate-500 uppercase tracking-widest px-1">{label}</label>
    <select name={name} value={value} onChange={onChange} className="bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-2xl p-3 text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500/50 shadow-sm transition-all">
      {options.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
    </select>
  </div>
);

const InputControl: React.FC<{ label: string, name: string, value: any, onChange: any }> = ({ label, name, value, onChange }) => (
  <div className="flex flex-col gap-2">
    <label className="text-[9px] font-black text-slate-600 dark:text-slate-500 uppercase tracking-widest px-1">{label}</label>
    <input type="number" name={name} value={value} onChange={onChange} className="bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-2xl p-3 text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500/50 shadow-sm transition-all" />
  </div>
);

export default App;
