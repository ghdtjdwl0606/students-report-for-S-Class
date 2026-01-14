
import React, { useState, useEffect } from 'react';
import { Question, StudentInput, SectionConfig } from './types';
import QuestionSetup from './components/QuestionSetup';
import StudentEntry from './components/StudentEntry';
import ReportView from './components/ReportView';
import LZString from 'lz-string';

enum Step {
  SETUP,
  INPUT,
  REPORT
}

const COLOR_MAP = [
  'from-blue-500 to-indigo-600',
  'from-emerald-500 to-teal-600',
  'from-rose-500 to-pink-600',
  'from-amber-500 to-orange-600',
  'from-violet-500 to-purple-600'
];

const initialSections: SectionConfig[] = [
  { id: 'sec-1', name: '영역 1', questionCount: 10, color: 'from-blue-500 to-indigo-600' },
  { id: 'sec-2', name: '영역 2', questionCount: 10, color: 'from-emerald-500 to-teal-600' }
];

const generateInitialQuestions = (secs: SectionConfig[]): Question[] => {
  const allQs: Question[] = [];
  secs.forEach(s => {
    for (let i = 1; i <= s.questionCount; i++) {
      allQs.push({
        id: `${s.id}-${i}`,
        number: i,
        sectionId: s.id,
        category: '일반',
        correctAnswer: '',
        points: 1.0,
      });
    }
  });
  return allQs;
};

const App: React.FC = () => {
  const [isSharedMode, setIsSharedMode] = useState(() => {
    if (typeof window !== 'undefined') {
      const hash = window.location.hash;
      return hash.startsWith('#v4=') || hash.startsWith('#v5=');
    }
    return false;
  });
  
  const [currentStep, setCurrentStep] = useState<Step>(isSharedMode ? Step.REPORT : Step.SETUP);
  const [sections, setSections] = useState<SectionConfig[]>(initialSections);
  const [questions, setQuestions] = useState<Question[]>(generateInitialQuestions(initialSections));
  const [studentInput, setStudentInput] = useState<StudentInput>({
    name: '',
    answers: {}
  });

  useEffect(() => {
    const checkHash = () => {
      const hash = window.location.hash;
      if (!hash) return;

      if (hash.startsWith('#v4=')) {
        decodeV4(hash.replace('#v4=', ''));
      } else if (hash.startsWith('#v5=')) {
        decodeV5(hash.replace('#v5=', ''));
      }
    };

    const decodeV4 = (compressed: string) => {
      try {
        const decompressed = LZString.decompressFromEncodedURIComponent(compressed);
        if (!decompressed) return;
        const [name, sectionsStr, questionsStr, answersStr] = decompressed.split('|');
        const restoredSections: SectionConfig[] = sectionsStr.split('^').map((s, i) => {
          const [sName, sCount, sColor] = s.split('*');
          return { id: `sec-shared-${i}`, name: sName, questionCount: Number(sCount), color: sColor };
        });
        const rawQData = questionsStr.split('^');
        let qPointer = 0;
        const finalQs: Question[] = [];
        const finalAnswers: Record<string, string> = {};
        const ansArray = answersStr.split('^');
        restoredSections.forEach(rs => {
           for(let k=1; k<=rs.questionCount; k++) {
              if (rawQData[qPointer]) {
                const [_, cat, correct, pts] = rawQData[qPointer].split('*');
                const qId = `qs-${rs.id}-${k}`;
                finalQs.push({
                   id: qId,
                   number: k,
                   sectionId: rs.id,
                   category: cat,
                   correctAnswer: correct,
                   points: Number(pts)
                });
                finalAnswers[qId] = ansArray[qPointer] || "";
              }
              qPointer++;
           }
        });
        setSections(restoredSections);
        setQuestions(finalQs);
        setStudentInput({ name, answers: finalAnswers });
        setIsSharedMode(true);
        setCurrentStep(Step.REPORT);
      } catch (e) { console.error("V4 Link Error", e); }
    };

    const decodeV5 = (compressed: string) => {
      try {
        const decompressed = LZString.decompressFromEncodedURIComponent(compressed);
        if (!decompressed) return;
        
        const [name, sectionsStr, catDictStr, questionsStr, answersStr] = decompressed.split('|');
        const catDict = catDictStr.split('^');
        
        const restoredSections: SectionConfig[] = sectionsStr.split('^').map((s, i) => {
          const [sName, sCount, colorIdx] = s.split('*');
          return { 
            id: `sec-shared-${i}`, 
            name: sName, 
            questionCount: Number(sCount), 
            color: COLOR_MAP[Number(colorIdx)] || COLOR_MAP[0] 
          };
        });

        const rawQData = questionsStr.split('^');
        const ansArray = answersStr.split('^');
        let qPointer = 0;
        const finalQs: Question[] = [];
        const finalAnswers: Record<string, string> = {};

        restoredSections.forEach(rs => {
           for(let k=1; k<=rs.questionCount; k++) {
              if (rawQData[qPointer]) {
                const [catIdx, correct, pts] = rawQData[qPointer].split('*');
                const qId = `qs-${rs.id}-${k}`;
                finalQs.push({
                   id: qId,
                   number: k,
                   sectionId: rs.id,
                   category: catDict[Number(catIdx)] || '일반',
                   correctAnswer: correct,
                   points: pts === '' ? 1.0 : Number(pts)
                });
                finalAnswers[qId] = ansArray[qPointer] || "";
              }
              qPointer++;
           }
        });

        setSections(restoredSections);
        setQuestions(finalQs);
        setStudentInput({ name, answers: finalAnswers });
        setIsSharedMode(true);
        setCurrentStep(Step.REPORT);
      } catch (e) { console.error("V5 Link Error", e); }
    };

    checkHash();
    window.addEventListener('hashchange', checkHash);
    return () => window.removeEventListener('hashchange', checkHash);
  }, []);

  const handleReset = () => {
    if (isSharedMode) {
      window.location.hash = '';
      window.location.reload(); 
    } else {
      setStudentInput({ name: '', answers: {} });
      setCurrentStep(Step.INPUT);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50/50">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50 no-print">
        <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-200">
              <i className="fas fa-graduation-cap text-lg"></i>
            </div>
            <div>
              <h1 className="font-bold text-slate-800 text-lg leading-tight">스마트 성적표</h1>
              <p className="text-[10px] text-slate-400 font-semibold tracking-widest uppercase">Report Builder Pro</p>
            </div>
          </div>
          
          {!isSharedMode && (
            <nav className="hidden md:flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
              {[
                { id: Step.SETUP, label: '정보 설정', icon: 'fa-cog' },
                { id: Step.INPUT, label: '답안 입력', icon: 'fa-edit' },
                { id: Step.REPORT, label: '결과 리포트', icon: 'fa-chart-pie' }
              ].map((s) => (
                <button
                  key={s.id}
                  disabled={currentStep < s.id}
                  onClick={() => setCurrentStep(s.id)}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${
                    currentStep === s.id 
                      ? 'bg-white text-indigo-600 shadow-sm' 
                      : 'text-slate-500 hover:text-slate-700'
                  } ${currentStep < s.id ? 'opacity-40 cursor-not-allowed' : ''}`}
                >
                  <i className={`fas ${s.icon}`}></i> {s.label}
                </button>
              ))}
            </nav>
          )}
        </div>
      </header>

      <main className="flex-1 container mx-auto px-6 py-10">
        {!isSharedMode && currentStep === Step.SETUP && (
          <QuestionSetup 
            sections={sections}
            setSections={setSections}
            questions={questions} 
            setQuestions={setQuestions} 
            onNext={() => setCurrentStep(Step.INPUT)} 
          />
        )}
        {!isSharedMode && currentStep === Step.INPUT && (
          <StudentEntry 
            sections={sections}
            questions={questions} 
            studentInput={studentInput} 
            setStudentInput={setStudentInput} 
            onPrev={() => setCurrentStep(Step.SETUP)}
            onSubmit={() => setCurrentStep(Step.REPORT)}
          />
        )}
        {(isSharedMode || currentStep === Step.REPORT) && (
          <ReportView 
            sections={sections}
            questions={questions} 
            studentInput={studentInput} 
            onReset={handleReset}
            isShared={isSharedMode}
          />
        )}
      </main>

      {!isSharedMode && (
        <footer className="bg-slate-50 border-t border-slate-200 py-8 no-print">
          <div className="max-w-6xl mx-auto px-6 text-center">
            <p className="text-slate-400 text-sm">© 2024 Smart Report Card Builder. All rights reserved.</p>
          </div>
        </footer>
      )}
    </div>
  );
};

export default App;
