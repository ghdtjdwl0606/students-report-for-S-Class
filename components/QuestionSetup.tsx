
import React, { useState } from 'react';
import { Question, SectionConfig } from '../types';

interface Props {
  sections: SectionConfig[];
  setSections: (sections: SectionConfig[]) => void;
  questions: Question[];
  setQuestions: (qs: Question[]) => void;
  onNext: () => void;
}

const QuestionSetup: React.FC<Props> = ({ sections, setSections, questions, setQuestions, onNext }) => {
  const [bulkText, setBulkText] = useState<Record<string, string>>({});
  const [showBulk, setShowBulk] = useState<Record<string, boolean>>({});

  const updateSectionName = (id: string, name: string) => {
    setSections(sections.map(s => s.id === id ? { ...s, name } : s));
  };

  const updateQuestionCount = (id: string, count: number) => {
    const newCount = Math.max(0, count);
    const section = sections.find(s => s.id === id);
    if (!section) return;

    // Update section config
    setSections(sections.map(s => s.id === id ? { ...s, questionCount: newCount } : s));

    // Update questions array
    const currentSectionQs = questions.filter(q => q.sectionId === id);
    let updatedQuestions = questions.filter(q => q.sectionId !== id);

    if (currentSectionQs.length < newCount) {
      // Add more
      const toAdd: Question[] = [];
      for (let i = currentSectionQs.length + 1; i <= newCount; i++) {
        toAdd.push({
          id: `${id}-${i}-${Date.now()}`,
          number: i,
          sectionId: id,
          category: '일반',
          correctAnswer: '',
          points: 1.0,
        });
      }
      updatedQuestions = [...updatedQuestions, ...currentSectionQs, ...toAdd];
    } else {
      // Truncate
      updatedQuestions = [...updatedQuestions, ...currentSectionQs.slice(0, newCount)];
    }
    
    setQuestions(updatedQuestions.sort((a, b) => {
        if (a.sectionId !== b.sectionId) return 0;
        return a.number - b.number;
    }));
  };

  const addSection = () => {
    const newId = `sec-${Date.now()}`;
    const colors = ['from-blue-500 to-indigo-600', 'from-emerald-500 to-teal-600', 'from-rose-500 to-pink-600', 'from-amber-500 to-orange-600', 'from-violet-500 to-purple-600'];
    const color = colors[sections.length % colors.length];
    
    setSections([...sections, { id: newId, name: `Section ${sections.length + 1}`, questionCount: 10, color }]);
    
    // Add initial questions for this section
    const newQs: Question[] = Array.from({ length: 10 }, (_, i) => ({
      id: `${newId}-${i + 1}`,
      number: i + 1,
      sectionId: newId,
      category: '일반',
      correctAnswer: '',
      points: 1.0,
    }));
    setQuestions([...questions, ...newQs]);
  };

  const removeSection = (id: string) => {
    setSections(sections.filter(s => s.id !== id));
    setQuestions(questions.filter(q => q.sectionId !== id));
  };

  const updateQuestion = (id: string, field: keyof Question, value: string | number) => {
    setQuestions(questions.map(q => q.id === id ? { ...q, [field]: value } : q));
  };

  const handleBulkPaste = (sectionId: string) => {
    const lines = (bulkText[sectionId] || '').trim().split('\n');
    const newQuestions = [...questions];
    
    lines.forEach((line, index) => {
      const columns = line.split(/\t|,/);
      const targetQuestion = newQuestions.find(q => q.sectionId === sectionId && q.number === index + 1);
      
      if (targetQuestion) {
        if (columns[0] !== undefined) targetQuestion.category = columns[0].trim();
        if (columns[1] !== undefined) targetQuestion.correctAnswer = columns[1].trim();
        if (columns[2] !== undefined) targetQuestion.points = parseFloat(columns[2]) || 0;
      }
    });

    setQuestions(newQuestions);
    setShowBulk({ ...showBulk, [sectionId]: false });
    setBulkText({ ...bulkText, [sectionId]: '' });
  };

  const renderSectionTable = (section: SectionConfig) => {
    const sectionQs = questions.filter(q => q.sectionId === section.id).sort((a, b) => a.number - b.number);
    
    return (
      <div key={section.id} className="mb-10 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className={`px-6 py-4 border-b border-slate-100 flex flex-wrap justify-between items-center bg-gradient-to-r ${section.color} text-white gap-4`}>
          <div className="flex items-center gap-4 flex-1">
            <input 
              type="text" 
              value={section.name} 
              onChange={(e) => updateSectionName(section.id, e.target.value)}
              className="bg-transparent border-b border-white/30 font-bold text-xl focus:outline-none focus:border-white w-full max-w-[200px]"
            />
            <div className="flex items-center gap-2 bg-black/10 px-3 py-1 rounded-lg">
              <span className="text-xs opacity-70">문항 수:</span>
              <input 
                type="number" 
                value={section.questionCount}
                onChange={(e) => updateQuestionCount(section.id, parseInt(e.target.value) || 0)}
                className="bg-transparent w-12 text-center font-bold focus:outline-none"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => setShowBulk({ ...showBulk, [section.id]: !showBulk[section.id] })}
              className="bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2"
            >
              <i className="fas fa-paste"></i> 엑셀 붙여넣기
            </button>
            <button 
              onClick={() => removeSection(section.id)}
              className="bg-red-500/20 hover:bg-red-500/40 px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
              title="섹션 삭제"
            >
              <i className="fas fa-trash"></i>
            </button>
          </div>
        </div>

        {showBulk[section.id] && (
          <div className="p-6 bg-slate-50 border-b border-slate-200">
            <label className="block text-sm font-bold text-slate-700 mb-2">
              엑셀/스프레드시트에서 [영역, 정답, 배점] 3개 열을 복사하여 아래에 붙여넣으세요.
            </label>
            <textarea 
              value={bulkText[section.id] || ''}
              onChange={(e) => setBulkText({ ...bulkText, [section.id]: e.target.value })}
              className="w-full h-32 p-3 border border-slate-300 rounded-xl text-sm font-mono focus:ring-2 focus:ring-indigo-500/20 mb-3"
              placeholder="영역	정답	배점&#10;어휘	1	1.5&#10;문법	3	1.2"
            />
            <div className="flex justify-end gap-2">
              <button 
                onClick={() => setShowBulk({ ...showBulk, [section.id]: false })}
                className="px-4 py-2 text-sm font-bold text-slate-500 hover:text-slate-800 transition-colors"
              >
                취소
              </button>
              <button 
                onClick={() => handleBulkPaste(section.id)}
                className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-indigo-700 transition-all shadow-md"
              >
                데이터 적용하기
              </button>
            </div>
          </div>
        )}

        <div className="overflow-x-auto max-h-[400px]">
          <table className="w-full text-left">
            <thead className="sticky top-0 z-10">
              <tr className="border-b border-slate-100 bg-slate-50 text-slate-600 text-xs uppercase tracking-wider">
                <th className="px-4 py-3 font-semibold w-16">번호</th>
                <th className="px-4 py-3 font-semibold">영역</th>
                <th className="px-4 py-3 font-semibold">정답</th>
                <th className="px-4 py-3 font-semibold w-28">배점</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {sectionQs.map((q) => (
                <tr key={q.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 font-bold text-slate-700">{q.number}</td>
                  <td className="px-4 py-3">
                    <input 
                      type="text" 
                      value={q.category}
                      onChange={(e) => updateQuestion(q.id, 'category', e.target.value)}
                      placeholder="영역"
                      className="w-full border border-slate-200 rounded-md px-3 py-1.5 text-sm focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <input 
                      type="text" 
                      value={q.correctAnswer}
                      onChange={(e) => updateQuestion(q.id, 'correctAnswer', e.target.value)}
                      placeholder="정답"
                      className="w-full border border-slate-200 rounded-md px-3 py-1.5 text-sm focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <input 
                      type="number" 
                      step="0.01"
                      value={q.points}
                      onChange={(e) => updateQuestion(q.id, 'points', parseFloat(e.target.value) || 0)}
                      className="w-full border border-slate-200 rounded-md px-3 py-1.5 text-sm focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8 flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-bold text-slate-800">1. 시험 정보 설정</h2>
          <p className="text-slate-500 mt-1">섹션을 추가하고 각 섹션별 문항 수와 정답을 설정하세요.</p>
        </div>
        <button 
          onClick={addSection}
          className="bg-indigo-50 text-indigo-600 hover:bg-indigo-100 px-4 py-2 rounded-xl font-bold transition-all flex items-center gap-2 border border-indigo-200"
        >
          <i className="fas fa-plus"></i> 섹션 추가
        </button>
      </div>

      <div className="space-y-6">
        {sections.map(section => renderSectionTable(section))}
        {sections.length === 0 && (
          <div className="p-20 text-center border-2 border-dashed border-slate-200 rounded-3xl bg-slate-50">
            <i className="fas fa-layer-group text-4xl text-slate-300 mb-4 block"></i>
            <p className="text-slate-400 font-medium">설정된 섹션이 없습니다. 상단의 '섹션 추가' 버튼을 눌러주세요.</p>
          </div>
        )}
      </div>

      <div className="mt-12 flex justify-end">
        <button 
          onClick={onNext}
          disabled={sections.length === 0}
          className="bg-slate-800 hover:bg-slate-900 disabled:bg-slate-200 text-white px-10 py-4 rounded-2xl font-bold transition-all shadow-lg flex items-center gap-3"
        >
          다음 단계: 학생 답안 입력 <i className="fas fa-chevron-right"></i>
        </button>
      </div>
    </div>
  );
};

export default QuestionSetup;
