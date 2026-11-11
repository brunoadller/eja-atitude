import { IoDocumentTextOutline } from 'react-icons/io5';
import DocumentRequestCard from './DocumentRequestCard';

export default function Atestado() {
  return (
    <DocumentRequestCard
      type="attestation"
      icon={<IoDocumentTextOutline />}
      intro="Comprovante de matrícula ativa. A 1ª via é gratuita; da 2ª via em diante há taxa de R$ 30,00, paga na secretaria."
    />
  );
}
