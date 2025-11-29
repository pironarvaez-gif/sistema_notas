import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { GraduationCap, Edit, Users, Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getUsers as fetchStudents, getGrades as fetchGrades, updateGrades as upsertGrade, deleteUser as removeUser } from '../utils/supabaseClient';

const TeacherDashboard = ({ user }) => {
  const [students, setStudents] = useState([]);
  const [credentialsSearch, setCredentialsSearch] = useState('');
  const [filterLevel, setFilterLevel] = useState('');
  const [filterGrade, setFilterGrade] = useState('');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [grades, setGrades] = useState({});
  const [newGrade, setNewGrade] = useState({ subject: '', value: '' });
  const [isEditing, setIsEditing] = useState(false);
  const [showStudentList, setShowStudentList] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    async function loadData() {
      try {
        const studentList = await fetchStudents();
        setStudents(studentList);
        // Cargar todas las notas de todos los estudiantes
        const allGradesArr = await fetchGrades(null, true);
        // Agrupar por student_id
        const gradesByStudent = {};
        allGradesArr.forEach(g => {
          if (!gradesByStudent[g.student_id]) gradesByStudent[g.student_id] = {};
          gradesByStudent[g.student_id][g.subject] = g.value;
        });
        setGrades(gradesByStudent);
      } catch (err) {
        setStudents([]);
        setGrades({});
      }
    }
    loadData();
  }, []);

  const handleDeleteStudent = async (student) => {
    const ok = window.confirm(`¿Eliminar al alumno ${student.name}? Esta acción no se puede deshacer.`);
    if (!ok) return;
    await removeUser(student.id);
    setStudents(prev => prev.filter(s => s.id !== student.id));
    if (selectedStudent?.id === student.id) setSelectedStudent(null);
    alert('Alumno eliminado');
  };

  const gradeOptionsFor = (level) => {
    if (!level) return [];
    if (level === 'prescolar') return ['Primer nivel', 'Segundo nivel', 'Tercer nivel'];
    if (level === 'primaria') return ['1er grado','2do grado','3er grado','4to grado','5to grado','6to grado'];
    if (level === 'secundaria') return ['7mo año','8vo año','9no año','10mo año','11mo año'];
    return [];
  };

  const handleLogout = () => {
    navigate('/');
  };

  const handleSelectStudent = (student) => {
    setSelectedStudent(student);
    setIsEditing(false);
    setNewGrade({ subject: '', value: '' });
          setIsEditing(false);
  };
  const handleEditGrade = (subject, grade) => {
    setNewGrade({ subject, value: String(grade) });
    setIsEditing(true);
  };

  const handleAddGrade = async (e) => {
    e.preventDefault();
    if (selectedStudent && newGrade.subject && newGrade.value) {
      const gradeValue = parseFloat(newGrade.value);
      if (gradeValue >= 0 && gradeValue <= 100) {
        await upsertGrade(selectedStudent.id, newGrade.subject, gradeValue);
        // Refrescar notas del estudiante
        const gradesArr = await fetchGrades(selectedStudent.id);
        const gradesObj = {};
        gradesArr.forEach(g => { gradesObj[g.subject] = g.value; });
        setGrades(prev => ({ ...prev, [selectedStudent.id]: gradesObj }));
        setNewGrade({ subject: '', value: '' });
      } else {
        alert('¡La nota debe estar entre 0 y 100!');
      }
    }
  };

  const studentList = students.map(student => (
    <motion.button
      key={student.id}
      onClick={() => handleSelectStudent(student)}
      className={`flex items-center gap-3 p-4 rounded-xl transition-all duration-300 w-full text-left ${
        selectedStudent?.id === student.id 
          ? 'bg-purple-500 text-white' 
          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
      }`}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <Users className="w-5 h-5" />
      {student.name}
    </motion.button>
  ));

  const filteredStudents = students.filter(s => {
    const lvl = s.level || '';
    const grd = s.grade || '';
    if (filterLevel && lvl !== filterLevel) return false;
    if (filterGrade && grd !== filterGrade) return false;
    return true;
  });

  const subjectList = selectedStudent ? Object.entries(grades[selectedStudent.id] || {}).map(([subject, grade]) => (
    <motion.div
      key={subject}
      className="flex justify-between items-center p-3 bg-gray-50 rounded-lg"
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.1 }}
    >
      <span className="font-medium">{subject}</span>
      <div className="flex items-center gap-2">
        <span className="font-bold text-purple-600">{grade}</span>
        <button
          type="button"
          onClick={() => handleEditGrade(subject, grade)}
          className="px-2 py-1 text-sm bg-gray-200 rounded hover:bg-gray-300"
          title="Editar nota"
        >
          Editar
        </button>
      </div>
    </motion.div>
  )) : null;

  const allStudents = students;

  const filteredCredentials = allStudents.filter(s => {
    if (!credentialsSearch) return true;
    const q = credentialsSearch.toLowerCase();
    return (s.name || '').toLowerCase().includes(q) || (s.email || '').toLowerCase().includes(q);
  });

  const studentCredentials = filteredCredentials.map((student, index) => (
    <motion.div
      key={student.id}
      className="flex justify-between items-center p-4 bg-gray-50 rounded-xl border border-gray-200"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <div className="flex flex-col">
        <span className="font-semibold text-gray-900">{student.name}</span>
        <span className="text-sm text-gray-600">Email: {student.email}</span>
        {student.password && (
          <span className="text-sm text-gray-600">Contraseña: <span className="font-mono bg-gray-200 px-2 py-1 rounded">{student.password}</span></span>
        )}
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => handleDeleteStudent(student)}
          className="px-2 py-1 text-sm bg-red-200 text-red-700 rounded hover:bg-red-300"
          title="Eliminar estudiante"
        >
          Eliminar
        </button>
      </div>
    </motion.div>
  ));

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-4">
      <div className="max-w-4xl mx-auto">
        <motion.div 
          className="bg-white/90 backdrop-blur-xl border border-gray-200/50 rounded-3xl p-6 mb-6 shadow-xl"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-3">
              <GraduationCap className="w-8 h-8 text-purple-600" />
              <h1 className="text-2xl font-bold text-gray-900">Bienvenido, {user.name}</h1>
            </div>
            <motion.button
              onClick={handleLogout}
              className="px-4 py-2 bg-red-500 text-white rounded-xl font-medium hover:bg-red-600 transition-all"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Salir
            </motion.button>
          </div>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-6">
          <motion.div 
            className="bg-white/90 backdrop-blur-xl border border-gray-200/50 rounded-3xl p-6"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Users className="w-5 h-5" />
              Elegir Estudiante
            </h2>
            <div className="mb-4 grid grid-cols-2 gap-2">
              <div>
                <label className="text-sm text-gray-600">Filtrar por nivel</label>
                <select value={filterLevel} onChange={(e) => { setFilterLevel(e.target.value); setFilterGrade(''); }} className="w-full mt-1 p-2 rounded-xl bg-gray-50 border border-gray-200">
                  <option value="">Todos</option>
                  <option value="prescolar">Preescolar</option>
                  <option value="primaria">Primaria</option>
                  <option value="secundaria">Secundaria</option>
                </select>
              </div>
              <div>
                <label className="text-sm text-gray-600">Filtrar por grado</label>
                <select value={filterGrade} onChange={(e) => setFilterGrade(e.target.value)} className="w-full mt-1 p-2 rounded-xl bg-gray-50 border border-gray-200">
                  <option value="">Todos</option>
                  {gradeOptionsFor(filterLevel).map(g => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {filteredStudents.length > 0 ? filteredStudents.map(student => (
                <motion.button
                  key={student.id}
                  onClick={() => handleSelectStudent(student)}
                  className={`flex items-center gap-3 p-4 rounded-xl transition-all duration-300 w-full text-left ${
                    selectedStudent?.id === student.id 
                      ? 'bg-purple-500 text-white' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Users className="w-5 h-5" />
                  <div className="flex-1">
                    <div>{student.name}</div>
                    <div className="text-xs text-gray-500">{student.level ? `${student.level} • ${student.grade}` : 'Sin nivel'}</div>
                  </div>
                </motion.button>
              )) : (
                <p className="text-gray-500 italic">No hay estudiantes que coincidan con el filtro.</p>
              )}
            </div>
          </motion.div>

          {selectedStudent && (
            <motion.div 
              className="bg-white/90 backdrop-blur-xl border border-gray-200/50 rounded-3xl p-6"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Edit className="w-5 h-5" />
                Notas de {selectedStudent.name}
              </h2>
              
              <div className="space-y-3 mb-6">
                <h3 className="font-semibold text-gray-700">Notas Guardadas (0-100):</h3>
                {Object.keys(grades[selectedStudent.id] || {}).length === 0 ? (
                  <p className="text-gray-500 italic">No hay notas aún.</p>
                ) : (
                  <div className="space-y-2">
                    {subjectList}
                  </div>
                )}
              </div>

              <form onSubmit={handleAddGrade} className="space-y-4">
                <input
                  type="text"
                  placeholder="Materia (ej: Matemáticas)"
                  value={newGrade.subject}
                  onChange={(e) => setNewGrade({ ...newGrade, subject: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/30"
                  disabled={isEditing}
                  required
                />
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  placeholder="Nota (0-100)"
                  value={newGrade.value}
                  onChange={(e) => setNewGrade({ ...newGrade, value: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/30"
                  required
                />
                <motion.button
                  type="submit"
                  className="w-full px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {isEditing ? 'Actualizar Nota' : 'Guardar Nota'}
                </motion.button>
                {isEditing && (
                  <button
                    type="button"
                    onClick={() => { setIsEditing(false); setNewGrade({ subject: '', value: '' }); }}
                    className="w-full mt-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300"
                  >
                    Cancelar edición
                  </button>
                )}
              </form>
            </motion.div>
          )}
        </div>

        <motion.div 
          className="mt-8 bg-white/90 backdrop-blur-xl border border-gray-200/50 rounded-3xl p-6 shadow-xl"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <motion.button
            onClick={() => setShowStudentList(!showStudentList)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-xl font-semibold hover:bg-blue-600 transition-all mb-4"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Eye className="w-4 h-4" />
            {showStudentList ? 'Ocultar' : 'Ver'} Credenciales de Alumnos
          </motion.button>

          {showStudentList && allStudents.length > 0 && (
            <div className="space-y-2 max-h-48 overflow-y-auto">
              <h3 className="font-semibold text-gray-700 mb-3">Lista de Estudiantes Registrados:</h3>
              <div className="mb-3">
                <input
                  type="text"
                  placeholder="Buscar por nombre o email..."
                  value={credentialsSearch}
                  onChange={(e) => setCredentialsSearch(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl"
                />
              </div>
              {studentCredentials}
              {filteredCredentials.length === 0 && (
                <p className="text-gray-500 italic text-center">No hay estudiantes registrados aún.</p>
              )}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default TeacherDashboard;