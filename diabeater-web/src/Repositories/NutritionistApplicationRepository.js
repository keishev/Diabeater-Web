import NutritionistApplicationService from '../Services/NutritionistApplicationService';

const NutritionistRepository = {
  submitNutritionistApplication: async (application) => {
    const { document, ...data } = application;
    return await NutritionistApplicationService.submitApplication(data, document);
  }
};

export default NutritionistRepository;
