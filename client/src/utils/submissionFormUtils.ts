import { showToast } from './toast';

export const calculateDaysLeft = (deadline: string): number => {
  const now = new Date();
  const deadlineDate = new Date(deadline);
  const diffTime = deadlineDate.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays > 0 ? diffDays : 0;
};

export const isValidFileType = (file: File): boolean => {
  const validTypes = [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
    'application/msword', // .doc
    'application/zip', // .zip
  ];
  const validExtensions = ['.pdf', '.docx', '.doc', '.zip'];
  const fileName = file.name.toLowerCase();

  return (
    validTypes.includes(file.type) ||
    validExtensions.some((ext) => fileName.endsWith(ext))
  );
};

export const validateFile = (file: File): boolean => {
  if (!isValidFileType(file)) {
    showToast.error('Chỉ chấp nhận file PDF, DOCX, DOC hoặc ZIP');
    return false;
  }
  if (file.size > 20 * 1024 * 1024) {
    showToast.error('File không được vượt quá 20MB');
    return false;
  }
  return true;
};


