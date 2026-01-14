
import React, { useEffect, useState, useRef } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, LabelList } from 'recharts';
import { EvaluationResult, Question, StudentInput, SectionConfig } from '../types';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import LZString from 'lz-string';

const COLOR_MAP = [
  'from-blue-500 to-indigo-600',
  'from-emerald-500 to-teal-600',
  'from-rose-500 to-pink-600',
  'from-amber-500 to-orange-600',
  'from-violet-500 to-purple-600'
];

const GRAMMAR_DESCRIPTIONS: Record<string, string> = {
  "명사/대명사": "문장의 주인이 되는 대상을 지칭하고 이를 대신하는 표현의 쓰임을 이해했는지 물어봅니다.",
  "동사": "주어의 동작이나 상태를 나타내어 문장을 완성하는 기본 원리를 이해를 확인합니다.",
  "형용사/부사": "대상의 상태나 동작을 구체적으로 묘사하여 의미를 풍부하게 하는 법을 이해했는지 물어봅니다.",
  "관사": "명사 앞에서 특정 여부를 결정짓는 a, an, the의 정확한 사용법을 이해를 확인합니다.",
  "의문사": "육하원칙에 따라 정보를 묻고 답하는 의문문의 구조를 이해했는지 물어봅니다.",
  "조동사": "동사에 능력, 허가, 의무 등의 세밀한 의미를 더하는 조동사의 역할을 이해를 확인합니다.",
  "시제": "사건이 일어난 시점을 과거, 현재, 미래로 정확히 표현하는 법을 이해했는지 물어봅니다.",
  "문장 형식": "동사의 성격에 따라 결정되는 5가지 문장 구성 원리를 이해를 확인합니다.",
  "문장 형태": "긍정, 부정, 의문 등 상황에 따라 문장의 형태를 바꾸는 법을 이해했는지 물어봅니다.",
  "접속사": "접속사를 활용해 원인, 양보, 조건을 표현하며 글의 전개 흐름을 매끄럽게 구성하는 능력을 이해했는지 물어봅니다.",
  "비교급": "대상 간의 정도 차이를 비교하거나 최상의 상태를 표현하는 방식을 이해했는지 물어봅니다.",
  "동명사/to 부정사": "동명사와 to 부정사의 쓰임을 이해하고, 특정 동사에서 형태에 따라 의미가 달라지는 것을 파악하고 있는지 물어봅니다.",
  "관계사": "선행사의 성격에 따라 알맞은 관계사를 선택하고, 복잡한 문장을 세련되게 결합하는 능력을 갖추었는지 확인합니다.",
  "분사/분사구문": "동사를 형용사처럼 활용하여 명사를 수식하는 현재분사와 과거분사의 의미 차이를 명확히 이해했는지 물어봅니다. 또한, 접속사가 포함된 긴 문장을 분사구문으로 축약하여 글의 효율성을 높이는 고급 문장 구성 원리를 이해를 확인합니다.",
  "가정법": "조건절, 가정법 과거, 가정법 과거완료의 차이를 명확히 구분하여 문장을 완성할 수 있는지 이해를 확인합니다. 또한 화자의 심리적 거리감을 표현하는 특수한 시제 규칙을 영작에 올바르게 적용하는지를 이해했는지 물어봅니다.",
  "특수구문": "강조, 도치, 세밀한 의미를 부각하는 기법을 이해했는지 물어봅니다."
};

const READING_DESCRIPTIONS: Record<string, string> = {
  "Author's Purpose": "글쓴이의 의도 문제. 글쓴이가 글을 통해 어떤 목적을 달성하려고 하는지 파악할 수 있는 능력을 물어봅니다.",
  "Detail": "세부사항 문제. 주요 세부 사항과 주제를 뒷받침하는 주요 정보를 이해하고, 지문의 내용과 다른 정보를 찾을 수 있는지를 물어봅니다.",
  "Inference": "추론 문제. 읽은 내용을 토대로 직접적으로 언급되지 않는 사항을 추론할 수 있는 능력을 물어봅니다.",
  "Main Idea": "주제 문제. 글이 전체적으로 무엇에 관한 것인지를 파악할 수 있는 능력을 물어봅니다.",
  "Vocabulary": "어휘 문제. 지문 속 어휘나 표현의 의미를 정확하게 파악할 수 있는지를 물어봅니다.",
  "Pronoun Referent": "지시어 문제. 지시어가 무엇을 의미하는지를 정확하게 파악할 수 있는지를 물어봅니다.",
  "Rhetorical Structure": "수사적 의도 문제. 특정 정보가 어떤 의도로 제시되었는지 파악할 수 있는지를 물어봅니다.",
  "Sentence Insertion": "문장 삽입 문제. 글의 흐름을 잘 이해하고 있는지를 물어봅니다."
};

const LISTENING_DESCRIPTIONS: Record<string, string> = {
  "Main Idea": "주제 문제. 들려주는 내용이 무엇에 관한 것인지를 파악할 수 있는지를 물어봅니다.",
  "Detail": "세부사항 문제. 주제를 뒷받침하는 중요한 세부 사항을 정확히 파악할 수 있는지를 물어봅니다.",
  "Inference": "추론 문제. 들은 내용을 토대로 직접적으로 언급되지 않은 사항을 추론할 수 있는 능력을 물어봅니다.",
  "Prosody": "화자의 어조 문제. 화자가 특정 내용을 말할 때 태도에 따라 언급되지 않은 사항을 파악할 수 있는 능력을 물어봅니다.",
  "Prediction": "예측 문제. 언급된 정보를 근거로 화자가 앞으로 할 일을 예측할 수 있는지를 물어봅니다.",
  "Speaker's Purpose": "화자의 의도 문제. 화자가 어떤 목적을 달성하려 하는지 왜 해당 내용을 말하는지를 정확하게 파악할 수 있는지를 물어봅니다.",
  "Rhetorical Device": "수사적 구조 문제. 화자가 특정 정보를 언급한 의도를 정확히 파악할 수 있는지를 물어봅니다."
};

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const category = data.category.trim();
    const sectionName = (data.sectionName || "").toLowerCase();
    
    let description = "";
    
    if (sectionName.includes('reading')) {
      description = READING_DESCRIPTIONS[category];
    } else if (sectionName.includes('listening')) {
      description = LISTENING_DESCRIPTIONS[category];
    }
    
    if (!description) {
      description = GRAMMAR_DESCRIPTIONS[category];
    }
    
    return (
      <div className="bg-slate-900/95 backdrop-blur-md text-white p-4 rounded-2xl shadow-2xl border border-white/10 max-w-[280px]">
        <div className="flex justify-between items-center gap-4 mb-2">
          <p className="font-bold text-indigo-300 text-sm">{data.category}</p>
          <p className="text-xs font-black bg-indigo-500 px-2 py-0.5 rounded-lg shrink-0">{Math.round(data.percentage)}%</p>
        </div>
        {description && (
          <div className="pt-2 border-t border-white/10">
            <p className="text-[11px] leading-relaxed text-slate-300 font-medium">
              {description}
            </p>
          </div>
        )}
      </div>
    );
  }
  return null;
};

interface Props {
  sections: SectionConfig[];
  questions: Question[];
  studentInput: StudentInput;
  onReset: () => void;
  isShared?: boolean;
}

const ReportView: React.FC<Props> = ({ sections, questions, studentInput, onReset, isShared }) => {
  const [result, setResult] = useState<EvaluationResult | null>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' ? window.innerWidth < 768 : false);
  const reportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    calculateResults();
    return () => window.removeEventListener('resize', handleResize);
  }, [questions, studentInput, sections]);

  const calculateResults = async () => {
    const isCorrect: Record<string, boolean> = {};
    const scoreBySection: Record<string, number> = {};
    const maxScoreBySection: Record<string, number> = {};
    const categoriesMap: Record<string, { category: string; total: number; correct: number; sectionName: string }> = {};

    sections.forEach(s => {
      scoreBySection[s.id] = 0;
      maxScoreBySection[s.id] = 0;
    });

    questions.forEach(q => {
      const studentAns = (studentInput.answers[q.id] || '').trim().toLowerCase();
      const correctAns = (q.correctAnswer || '').trim().toLowerCase();
      const correct = studentAns !== '' && studentAns === correctAns;
      
      isCorrect[q.id] = correct;
      maxScoreBySection[q.sectionId] = (maxScoreBySection[q.sectionId] || 0) + q.points;
      
      if (correct) {
        scoreBySection[q.sectionId] = (scoreBySection[q.sectionId] || 0) + q.points;
      }

      const section = sections.find(s => s.id === q.sectionId);
      const sectionName = section?.name || '기타';
      const mapKey = `${q.sectionId}_${q.category}`;
      
      if (!categoriesMap[mapKey]) {
        categoriesMap[mapKey] = { category: q.category, total: 0, correct: 0, sectionName };
      }
      categoriesMap[mapKey].total += 1;
      if (correct) categoriesMap[mapKey].correct += 1;
    });

    const categoryResults = Object.values(categoriesMap).map(entry => ({
      category: entry.category,
      sectionName: entry.sectionName,
      totalQuestions: entry.total,
      correctCount: entry.correct,
      percentage: (entry.correct / entry.total) * 100
    }));

    const totalScore = Object.values(scoreBySection).reduce((acc, val) => acc + val, 0);

    const finalResult: EvaluationResult = {
      studentName: studentInput.name,
      totalScore: Math.round(totalScore * 100) / 100,
      scoreBySection,
      maxScoreBySection,
      categoryResults,
      isCorrect
    };

    setResult(finalResult);
  };

  const copyShareLink = () => {
    try {
      const uniqueCats = Array.from(new Set(questions.map(q => q.category)));
      const catDictStr = uniqueCats.join(',');
      const sectionsStr = sections.map(s => {
        const colorIdx = COLOR_MAP.indexOf(s.color);
        return `${s.name},${s.questionCount},${colorIdx === -1 ? 0 : colorIdx}`;
      }).join(';');
      const questionsStr = questions.map(q => {
        const catIdx = uniqueCats.indexOf(q.category);
        const pts = q.points === 1 ? '' : q.points.toString();
        return `${catIdx},${q.correctAnswer},${pts}`;
      }).join(';');
      const answersStr = questions.map(q => studentInput.answers[q.id] || "").join(';');
      const pack = [studentInput.name, sectionsStr, catDictStr, questionsStr, answersStr].join('~');
      const compressed = LZString.compressToEncodedURIComponent(pack);
      const url = `${window.location.origin}${window.location.pathname}#s=${compressed}`;
      navigator.clipboard.writeText(url).then(() => alert("성적표 공유 링크가 복사되었습니다."));
    } catch (err) {
      alert("링크 생성 실패");
    }
  };

  const downloadPdf = async () => {
    if (!reportRef.current) return;
    setIsGeneratingPdf(true);
    
    const originalStyle = reportRef.current.getAttribute('style');
    
    // PDF 최적화를 위해 레이아웃 고정
    reportRef.current.style.width = '1200px';
    reportRef.current.style.maxWidth = 'none';
    reportRef.current.style.padding = '40px';
    reportRef.current.style.backgroundColor = '#f8fafc';

    try {
      // 렌더링 안정화 대기
      await new Promise(resolve => setTimeout(resolve, 800));

      const canvas = await html2canvas(reportRef.current, { 
        scale: 2, 
        useCORS: true, 
        backgroundColor: '#f8fafc',
        windowWidth: 1200,
        height: reportRef.current.scrollHeight, // 전체 높이 캡처 강제
        scrollY: -window.scrollY,
        logging: false
      });

      // 레이아웃 원복
      if (originalStyle) {
        reportRef.current.setAttribute('style', originalStyle);
      } else {
        reportRef.current.removeAttribute('style');
      }

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      const imgWidth = pdfWidth;
      const imgHeight = (canvas.height * pdfWidth) / canvas.width;
      
      let heightLeft = imgHeight;
      let position = 0;

      // 첫 페이지 추가
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
      heightLeft -= pdfHeight;

      // 남은 높이가 있으면 페이지 반복 추가 (Pagination)
      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
        heightLeft -= pdfHeight;
      }

      pdf.save(`${studentInput.name}_성적표.pdf`);
    } catch (e) {
      console.error(e);
      alert("PDF 생성 중 오류가 발생했습니다.");
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  if (!result) return <div className="p-20 text-center font-bold text-slate-400">데이터를 불러오는 중입니다...</div>;

  const grandMaxScore = Object.values(result.maxScoreBySection).reduce((a: number, b: number) => a + b, 0) as number;

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20">
      <div className="flex flex-wrap justify-end gap-3 no-print px-4 md:px-0">
        {!isShared && (
          <button onClick={copyShareLink} className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 px-5 py-3 rounded-xl font-bold transition-all shadow-sm active:scale-95">
            <i className="fas fa-share-nodes text-indigo-500"></i> 공유 링크 복사
          </button>
        )}
        <button onClick={downloadPdf} disabled={isGeneratingPdf} className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-indigo-600 text-white hover:bg-indigo-700 px-5 py-3 rounded-xl font-bold transition-all shadow-md active:scale-95 disabled:opacity-50">
          {isGeneratingPdf ? <i className="fas fa-spinner animate-spin"></i> : <><i className="fas fa-file-pdf"></i> PDF 저장하기</>}
        </button>
      </div>

      <div ref={reportRef} id="report-container" className="space-y-6 p-4 md:p-0 transition-all duration-300 origin-top">
        {/* Header Section */}
        <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-[2.5rem] p-8 md:p-10 text-white shadow-xl relative overflow-hidden border border-slate-700">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-20 -mt-20 blur-3xl"></div>
          <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="text-center md:text-left">
              <span className="inline-block bg-indigo-500/20 backdrop-blur-md px-4 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider mb-4 border border-indigo-500/30">Official Student Report</span>
              <h2 className="text-4xl font-black">{result.studentName} 학생</h2>
              <div className="mt-6 flex flex-wrap gap-4 justify-center md:justify-start">
                {sections.map(s => (
                  <div key={s.id} className="bg-white/5 px-4 py-3 rounded-2xl border border-white/10 min-w-[120px] backdrop-blur-sm transition-all hover:bg-white/10">
                    <span className="text-[10px] uppercase font-bold text-indigo-300 block mb-1">{s.name}</span>
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl font-black">{Math.round((result.scoreBySection[s.id] || 0) * 10) / 10}</span>
                      <span className="text-xs font-bold opacity-40">/ {Math.round((result.maxScoreBySection[s.id] || 0) * 10) / 10}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-white text-slate-900 rounded-[2.5rem] p-8 text-center shadow-2xl min-w-[240px] border border-white/20">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Grand Total Score</span>
              <div className="text-6xl font-black text-indigo-600 mt-2 tracking-tighter">
                {result.totalScore}
              </div>
              <div className="mt-2 text-slate-400 font-bold text-sm">
                out of {grandMaxScore} points
              </div>
              <div className="mt-4 h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-indigo-500 rounded-full transition-all duration-1000 ease-out" 
                  style={{ width: `${grandMaxScore > 0 ? (result.totalScore / grandMaxScore) * 100 : 0}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 gap-8">
          {sections.map((section) => {
            const sectionData = result.categoryResults.filter(r => r.sectionName === section.name);
            return (
              <div key={section.id} className="bg-white rounded-[2rem] p-8 border border-slate-200 shadow-sm page-break-avoid">
                <div className="flex justify-between items-start mb-8">
                  <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2 uppercase tracking-tight">
                    <div className={`w-2 h-6 rounded-full bg-gradient-to-b ${section.color}`}></div>
                    {section.name} Analysis
                  </h3>
                  <div className="text-sm font-bold text-slate-400 bg-slate-50 px-4 py-2 rounded-full border border-slate-100">
                    {Math.round((result.scoreBySection[section.id] || 0) * 10) / 10} / {Math.round((result.maxScoreBySection[section.id] || 0) * 10) / 10}
                  </div>
                </div>
                <div className="h-[320px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart 
                      data={sectionData} 
                      layout={isMobile ? "horizontal" : "vertical"} 
                      margin={{ left: isMobile ? 0 : 40, right: 40, top: 20 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={!isMobile} vertical={isMobile} />
                      <XAxis 
                        type={isMobile ? "category" : "number"} 
                        dataKey={isMobile ? "category" : undefined} 
                        domain={isMobile ? undefined : [0, 100]} 
                        hide={!isMobile} 
                      />
                      <YAxis 
                        type={isMobile ? "number" : "category"} 
                        dataKey={isMobile ? undefined : "category"} 
                        domain={isMobile ? [0, 100] : undefined} 
                        hide={isMobile} 
                        width={110} 
                        tick={{ fontSize: 11, fontWeight: 700, fill: '#64748b' }} 
                      />
                      <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f1f5f9', opacity: 0.4 }} />
                      <Bar dataKey="percentage" radius={isMobile ? [6, 6, 0, 0] : [0, 6, 6, 0]} barSize={28}>
                        {sectionData.map((entry: any, i: number) => (
                          <Cell key={`cell-${i}`} fill={entry.percentage >= 80 ? '#10b981' : entry.percentage >= 50 ? '#6366f1' : '#f43f5e'} />
                        ))}
                        <LabelList 
                          dataKey="percentage" 
                          position={isMobile ? "top" : "right"} 
                          formatter={(v: number) => `${Math.round(v)}%`} 
                          style={{ fontSize: '11px', fontWeight: 'bold', fill: '#64748b' }} 
                        />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {!isShared && (
        <div className="flex justify-center pt-8 no-print px-4">
          <button onClick={onReset} className="w-full md:w-auto bg-slate-900 text-white px-12 py-4 rounded-2xl font-bold shadow-xl active:scale-95 transition-transform">
            처음으로 돌아가기
          </button>
        </div>
      )}
    </div>
  );
};

export default ReportView;
