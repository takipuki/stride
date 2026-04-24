import type { PageLoad } from './$types';

export const load: PageLoad = ({ params }) => {
  return {
    student_id: params.student_id
  };
};