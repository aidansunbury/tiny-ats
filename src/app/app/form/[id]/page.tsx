import { redirect } from "next/navigation";

const FormView = async ({ params }: { params: { id: string } }) => {
	return redirect(`/app/form/${params.id}/questions`);
};

export default FormView;
