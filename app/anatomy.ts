export type SystemId = 'skeletal'|'muscular'|'arterial'|'venous'|'nervous'|'digestive'|'respiratory'|'urinary'|'reproductive'|'lymphatic'|'endocrine'|'integumentary'|'connective'|'sensory'|'cardiac';
export const SYSTEMS: {id:SystemId;name:string;color:string;description:string}[] = [
 {id:'skeletal',name:'Esqueleto',color:'#e2d9ba',description:'Os ossos formam a estrutura de sustentação do corpo, protegem órgãos e servem de ponto de fixação para os músculos. O tecido interno também armazena minerais e produz células do sangue.'},
 {id:'muscular',name:'Músculos',color:'#a85b50',description:'Os músculos esqueléticos geram movimento ao tracionar seus pontos de inserção. Junto com os tendões, movem as articulações, estabilizam a postura e produzem calor.'},
 {id:'cardiac',name:'Coração',color:'#b96760',description:'O coração é uma bomba muscular de quatro câmaras. Suas valvas mantêm o sangue fluindo num só sentido pelas circulações pulmonar e sistêmica.'},
 {id:'sensory',name:'Órgãos dos sentidos',color:'#b0c8ce',description:'Estruturas dos sentidos especiais, como visão, audição e equilíbrio. Seus tecidos especializados detectam estímulos e trabalham com o sistema nervoso para transmitir a informação.'},
 {id:'arterial',name:'Artérias',color:'#c05245',description:'O coração impulsiona o sangue pela circulação. As artérias levam o sangue para longe do coração, irrigando os tecidos ou, na circulação pulmonar, os pulmões.'},
 {id:'venous',name:'Veias',color:'#527c9f',description:'As veias devolvem o sangue ao coração. Redes superficiais e profundas recolhem o sangue dos tecidos; as veias pulmonares trazem o sangue oxigenado dos pulmões.'},
 {id:'nervous',name:'Sistema nervoso',color:'#d8b565',description:'Encéfalo, medula espinal e nervos periféricos conduzem e processam sinais. Sustentam a sensibilidade, o movimento, a coordenação e a regulação automática das funções do corpo.'},
 {id:'respiratory',name:'Respiratório',color:'#b98991',description:'As vias aéreas conduzem o ar até os pulmões, onde oxigênio e gás carbônico são trocados entre o ar e o sangue. A respiração depende das variações de pressão produzidas pelos músculos respiratórios.'},
 {id:'digestive',name:'Digestório',color:'#b8916b',description:'O tubo digestório quebra os alimentos, absorve nutrientes e água e conduz os resíduos adiante. Órgãos anexos contribuem com a bile e as enzimas digestivas.'},
 {id:'urinary',name:'Urinário',color:'#b47961',description:'Os rins filtram o sangue e regulam o equilíbrio de líquidos, eletrólitos e ácido-base. A urina segue pelos ureteres até a bexiga e sai pela uretra.'},
 {id:'lymphatic',name:'Linfático',color:'#879f7c',description:'Os vasos linfáticos devolvem à circulação o excesso de líquido dos tecidos. Linfonodos e outros órgãos linfoides participam da vigilância e da resposta imune.'},
 {id:'endocrine',name:'Endócrino',color:'#c5a09a',description:'Os órgãos endócrinos liberam hormônios no sangue para coordenar processos como metabolismo, crescimento, resposta ao estresse e reprodução.'},
 {id:'reproductive',name:'Reprodutor',color:'#bda098',description:'As estruturas reprodutoras masculinas representadas aqui participam da produção, maturação e transporte dos espermatozoides e da produção de hormônios sexuais.'},
 {id:'integumentary',name:'Superfície do corpo',color:'#ba9b7d',description:'A superfície do corpo serve como referência anatômica externa. O sistema tegumentar forma uma barreira protetora e participa da sensibilidade e da regulação da temperatura.'},
 {id:'connective',name:'Tecido conjuntivo',color:'#aec3bb',description:'Cartilagens, ligamentos e outros tecidos conjuntivos sustentam, unem e separam estruturas. Entre suas funções estão estabilizar articulações e distribuir cargas mecânicas.'},
];
export interface Part {id:string;name:string;conceptId:string;system:SystemId;chunk:number;positions:number;normals:number;indices:number;vertexCount:number;indexCount:number;bounds:[number[],number[]]}
export interface Concept {id:string;name:string;elements:string[]}
export interface Atlas {version:string;sex?:'male';source?:string;scope?:string;parts:Part[];concepts:Concept[];chunks:{url:string;bytes:number;gzip?:string;gzipBytes?:number}[];triangles:number}
export type View = 'front'|'back'|'side'|'perspective';
export type LayerOpacity = {muscles:number;skeleton:number;organs:number};
export interface SceneState {inspectorOpen?:boolean;explode:number;visible:SystemId[];selected:string[];isolate:boolean;view:View;rotate:boolean;reset:number;
 /** Dim everything except the selection. */ focus:boolean;
 /** Opacity per layer, 0–1. */ layers:LayerOpacity;
 /** Smart labels on/off. */ labels:boolean;
 /** Part ids lit up by the tutor. */ highlight:string[];
 /** Camera dolly steps: positive = closer. */ zoom:number}
export const DEFAULT_VISIBLE:SystemId[] = ['cardiac','sensory','skeletal','muscular','arterial','venous','nervous','respiratory','digestive','urinary','lymphatic','endocrine','reproductive','connective'];
export const EXPLANATIONS:Record<string,string> = {
 'heart':'Bomba muscular no tórax. O lado direito envia sangue aos pulmões; o lado esquerdo o envia para a circulação sistêmica.',
 'liver':'Órgão volumoso sob o lado direito do diafragma. Processa os nutrientes absorvidos, produz a bile e sintetiza muitas proteínas do sangue.',
 'brain':'Órgão central do sistema nervoso. Suas regiões interligadas sustentam percepção, movimento, memória, linguagem e a regulação das funções do corpo.',
 'stomach':'Câmara muscular entre o esôfago e o intestino delgado. Armazena e mistura o alimento com ácido e enzimas antes de liberá-lo para o duodeno.',
 'spleen':'Órgão linfoide no quadrante superior esquerdo do abdome. Filtra o sangue, remove hemácias envelhecidas e participa da resposta imune.',
 'pancreas':'Órgão abdominal com funções digestivas e endócrinas. Fornece enzimas ao intestino delgado e libera hormônios como insulina e glucagon.',
 'urinary bladder':'Reservatório muscular na pelve que armazena a urina que chega dos rins pelos ureteres.',
 'trachea':'Principal via aérea entre a laringe e os brônquios. Seus anéis de cartilagem mantêm a via aberta durante a respiração.',
 'diaphragm':'Músculo largo que separa o tórax do abdome. Ao contrair, aumenta o volume do tórax e ajuda a puxar o ar para os pulmões.',
 'right lung':'Pulmão direito, dividido em três lobos. Nele o ar inspirado troca oxigênio e gás carbônico com o sangue.',
 'left lung':'Pulmão esquerdo, com dois lobos e a incisura cardíaca, que acomoda o coração.',
 'kidney':'Os rins filtram o sangue, regulam água e sais e produzem a urina.',
 'small intestine':'Segmento mais longo do tubo digestório (duodeno, jejuno e íleo), onde ocorre a maior parte da digestão e absorção de nutrientes.',
 'large intestine':'Absorve água e eletrólitos e forma as fezes; vai do ceco ao reto.',
 'esophagus':'Tubo muscular que leva o alimento da faringe ao estômago por ondas peristálticas.',
};
export function explanation(name:string,system:SystemId){return EXPLANATIONS[name.toLowerCase()] ?? SYSTEMS.find(s=>s.id===system)?.description ?? '';}
