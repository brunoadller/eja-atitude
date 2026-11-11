import { IoSchoolOutline } from 'react-icons/io5';
import DocumentRequestCard from './DocumentRequestCard';

export default function Diploma() {
  return (
    <DocumentRequestCard
      type="certificate"
      icon={<IoSchoolOutline />}
      intro="Certificado de Conclusão com o histórico escolar. Valor de referência: R$ 70,00 (a 1ª via é gratuita; da 2ª via em diante a taxa é paga na secretaria)."
      footer={
        <div className="card p-5 text-sm text-slate-500">
          <strong className="text-slate-900">Quando é liberado:</strong> quando você tiver média mínima de 5,0 em todas as disciplinas
          (a recuperação conta, mas enquanto houver nota abaixo de 5,0 o certificado fica bloqueado), todas as provas concluídas
          e todas as parcelas quitadas. A emissão pode levar até 30 dias úteis após o término dos módulos.
        </div>
      }
    />
  );
}
