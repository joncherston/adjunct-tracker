/**
 * Reports Component
 * View semester reports showing all submitted adjunct data
 */
import { useState, useEffect } from 'react';
import { FileText, AlertTriangle, Users, Download, Printer } from 'lucide-react';
import toast from 'react-hot-toast';
import { semestersAPI, reportsAPI } from '../../services/api';
import AppHeader from '../common/AppHeader';

const Reports = () => {
  const [semesters, setSemesters] = useState([]);
  const [selectedSemester, setSelectedSemester] = useState(null);
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingReport, setLoadingReport] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState('all');

  useEffect(() => {
    loadSemesters();
  }, []);

  useEffect(() => {
    if (selectedSemester) {
      loadReport();
    }
  }, [selectedSemester]);

  const loadSemesters = async () => {
    try {
      setLoading(true);
      const response = await semestersAPI.getAll();
      setSemesters(response.data);

      // Auto-select first semester
      if (response.data.length > 0 && !selectedSemester) {
        setSelectedSemester(response.data[0]);
      }
    } catch (error) {
      console.error('Error loading semesters:', error);
      toast.error('Failed to load semesters');
    } finally {
      setLoading(false);
    }
  };

  const loadReport = async () => {
    if (!selectedSemester) return;

    try {
      setLoadingReport(true);
      const response = await reportsAPI.getSemesterReport(selectedSemester.id);
      setReportData(response.data);
      setSelectedDepartment('all'); // Reset filter when loading new report
    } catch (error) {
      console.error('Error loading report:', error);
      toast.error('Failed to load report data');
    } finally {
      setLoadingReport(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    if (!reportData) return;

    const rows = [['Department', 'Adjunct Name', 'Email', 'Campuses', 'Courses', 'Multi-Department']];

    reportData.assignments.forEach(assignment => {
      const isMultiDept = reportData.multi_department_adjunct_ids.includes(assignment.adjunct.id);
      const campuses = assignment.campus_assignments?.map(ca => ca.campus.name).join('; ') || '';
      const courses = assignment.course_assignments?.map(ca => ca.course.course_name).join('; ') || '';

      rows.push([
        assignment.department.name,
        assignment.adjunct.full_name,
        assignment.adjunct.email,
        campuses,
        courses,
        isMultiDept ? 'Yes' : 'No'
      ]);
    });

    const csvContent = rows.map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `adjunct-report-${selectedSemester.display_name.replace(' ', '-')}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Group assignments by department
  const groupByDepartment = () => {
    if (!reportData) return {};

    const grouped = {};
    reportData.assignments.forEach(assignment => {
      const deptName = assignment.department.name;
      if (!grouped[deptName]) {
        grouped[deptName] = [];
      }
      grouped[deptName].push(assignment);
    });

    return grouped;
  };

  // Get filtered assignments
  const getFilteredAssignments = () => {
    if (!reportData) return [];

    if (selectedDepartment === 'all') {
      return reportData.assignments;
    }

    return reportData.assignments.filter(
      assignment => assignment.department.name === selectedDepartment
    );
  };

  const groupedData = groupByDepartment();
  const departments = Object.keys(groupedData).sort();
  const filteredAssignments = getFilteredAssignments();

  // Count stats
  const submittedCount = reportData?.requests.filter(r => r.is_submitted).length || 0;
  const totalRequests = reportData?.requests.length || 0;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <AppHeader
        icon={FileText}
        title="Adjunct Reports"
        subtitle="View submitted adjunct instructor data"
        actions={
          <div className="flex space-x-2 print:hidden">
            <button
              onClick={handleExportCSV}
              disabled={!reportData || reportData.assignments.length === 0}
              className="btn-secondary flex items-center space-x-2 disabled:opacity-50"
            >
              <Download className="h-5 w-5" />
              <span>Export CSV</span>
            </button>
            <button
              onClick={handlePrint}
              disabled={!reportData || reportData.assignments.length === 0}
              className="btn-primary flex items-center space-x-2 disabled:opacity-50"
            >
              <Printer className="h-5 w-5" />
              <span>Print</span>
            </button>
          </div>
        }
      />

      {/* Semester Selector */}
      <div className="bg-white border-b border-gray-200 print:shadow-none print:hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Semester
          </label>
          <select
            value={selectedSemester?.id || ''}
            onChange={(e) => {
              const semester = semesters.find(s => s.id === parseInt(e.target.value));
              setSelectedSemester(semester);
            }}
            className="input max-w-md"
          >
            {semesters.map(semester => (
              <option key={semester.id} value={semester.id}>
                {semester.display_name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-suscc-blue"></div>
            <p className="mt-4 text-gray-600">Loading semesters...</p>
          </div>
        ) : loadingReport ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-suscc-blue"></div>
            <p className="mt-4 text-gray-600">Loading report...</p>
          </div>
        ) : reportData ? (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6 print:mb-4">
              <div className="card bg-gradient-to-br from-suscc-blue to-suscc-blue-dark text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm opacity-90">Total Adjuncts</p>
                    <p className="text-3xl font-bold mt-1">{reportData.total_adjuncts}</p>
                  </div>
                  <Users className="h-12 w-12 opacity-50" />
                </div>
              </div>

              <div className="card bg-gradient-to-br from-success to-green-600 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm opacity-90">Departments Submitted</p>
                    <p className="text-3xl font-bold mt-1">
                      {submittedCount} / {totalRequests}
                    </p>
                  </div>
                  <FileText className="h-12 w-12 opacity-50" />
                </div>
              </div>

              <div className="card bg-gradient-to-br from-yellow-400 to-yellow-600 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm opacity-90">Multi-Department</p>
                    <p className="text-3xl font-bold mt-1">
                      {reportData.multi_department_adjunct_ids.length}
                    </p>
                  </div>
                  <AlertTriangle className="h-12 w-12 opacity-50" />
                </div>
              </div>
            </div>

            {/* Department Filter */}
            <div className="card mb-6 print:hidden">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Filter by Department
              </label>
              <select
                value={selectedDepartment}
                onChange={(e) => setSelectedDepartment(e.target.value)}
                className="input max-w-md"
              >
                <option value="all">All Departments ({reportData.assignments.length} adjuncts)</option>
                {departments.map(dept => (
                  <option key={dept} value={dept}>
                    {dept} ({groupedData[dept].length})
                  </option>
                ))}
              </select>
            </div>

            {/* Adjunct List */}
            <div className="card">
              <h2 className="text-xl font-bold text-suscc-blue mb-4">
                {selectedDepartment === 'all' ? 'All Adjuncts' : selectedDepartment}
                <span className="text-gray-600 font-normal text-base ml-2">
                  ({filteredAssignments.length} instructor{filteredAssignments.length !== 1 ? 's' : ''})
                </span>
              </h2>

              {filteredAssignments.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        {selectedDepartment === 'all' && (
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Department
                          </th>
                        )}
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Name
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Email
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Campus(es)
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Courses
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider print:hidden">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredAssignments.map((assignment, index) => {
                        const isMultiDept = reportData.multi_department_adjunct_ids.includes(assignment.adjunct.id);

                        return (
                          <tr key={index} className={isMultiDept ? 'bg-yellow-50' : ''}>
                            {selectedDepartment === 'all' && (
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                {assignment.department.name}
                              </td>
                            )}
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {assignment.adjunct.full_name}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                              {assignment.adjunct.email}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-600">
                              {assignment.campus_assignments && assignment.campus_assignments.length > 0 ? (
                                <div className="flex flex-wrap gap-1">
                                  {assignment.campus_assignments.map((campusAssignment, idx) => (
                                    <span key={idx} className="inline-block px-2 py-0.5 bg-suscc-gold-light text-suscc-blue text-xs rounded">
                                      {campusAssignment.campus.name}
                                    </span>
                                  ))}
                                </div>
                              ) : (
                                <span className="text-gray-400 text-xs">-</span>
                              )}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-600">
                              {assignment.course_assignments && assignment.course_assignments.length > 0 ? (
                                <div className="flex flex-wrap gap-1">
                                  {assignment.course_assignments.map((courseAssignment, idx) => (
                                    <span key={idx} className="inline-block px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded">
                                      {courseAssignment.course.course_name}
                                    </span>
                                  ))}
                                </div>
                              ) : (
                                <span className="text-gray-400 text-xs">-</span>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm print:hidden">
                              {isMultiDept && (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                  <AlertTriangle className="h-3 w-3 mr-1" />
                                  Multi-Department
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No adjuncts found</p>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="card text-center py-12">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">Select a semester to view the report</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Reports;
