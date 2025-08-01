/* eslint-disable react/prop-types */
import {
    Drawer,
    DrawerClose,
    DrawerContent,
    DrawerFooter,
    DrawerHeader,
    DrawerTitle,
    DrawerTrigger,
  } from "@/components/ui/drawer";
  import { Button } from "./ui/button";
  import { Input } from "./ui/input";
  import { z } from "zod";
  import { zodResolver } from "@hookform/resolvers/zod";
  import { useForm } from "react-hook-form";
  import useFetch from "@/hooks/use-fetch";
  import { addNewCompany } from "@/api/apiCompanies";
  import { BarLoader } from "react-spinners";
  import { useEffect } from "react";
  import { useToast } from "@/hooks/use-toast";
  
  /**
   * COMPANY REGISTRATION FORM VALIDATION SCHEMA
   * Zod schema for validating new company data
   */
  const schema = z.object({
    name: z.string().min(1, { message: "Company name is required" }),
    logo: z
      .any()
      .refine(
        (file) =>
          file[0] &&
          (file[0].type === "image/png" || file[0].type === "image/jpeg"),
        {
          message: "Only Images are allowed",
        }
      ),
  });
  
  /**
   * ADD COMPANY DRAWER COMPONENT
   * Modal form for registering new companies on HIRED platform
   * 
   * FEATURES:
   * - Modal drawer interface for company registration
   * - Form validation using Zod schema
   * - Company name input with validation
   * - Logo upload (PNG/JPEG only)
   * - Real-time validation and error display
   * - Loading states during submission
   * - Automatic form reset after successful submission
   * - Integration with companies API
   * 
   * USAGE CONTEXT:
   * - Used in post-job page when company doesn't exist
   * - Allows recruiters to add their company to platform
   * - Required step before posting jobs
   * - Integrates with Supabase for company data storage
   * - Refreshes company list after successful addition
   * 
   * @param {Function} fetchCompanies - Function to refresh companies list after addition
   */
  const AddCompanyDrawer = ({ fetchCompanies }) => {
    const { toast } = useToast();
    
    const {
      register,
      handleSubmit,
      formState: { errors },
    } = useForm({
      resolver: zodResolver(schema),
    });
  
    const {
      loading: loadingAddCompany,
      error: errorAddCompany,
      data: dataAddCompany,
      fn: fnAddCompany,
    } = useFetch(addNewCompany);
  
    const onSubmit = async (data) => {
      fnAddCompany({
        ...data,
        logo: data.logo[0],
      });
    };
  
    useEffect(() => {
      if (dataAddCompany?.length > 0) {
        toast({
          title: "🏢 Company added successfully!",
          description: `${dataAddCompany[0].name} has been added to the platform.`,
          variant: "default",
        });
        fetchCompanies();
      }
    }, [dataAddCompany, fetchCompanies, toast]);

    // Show error toast if company creation fails
    useEffect(() => {
      if (errorAddCompany) {
        toast({
          title: "❌ Error adding company",
          description: errorAddCompany.message || "Failed to add the company. Please try again.",
          variant: "destructive",
        });
      }
    }, [errorAddCompany, toast]);
  
    return (
      <Drawer>
        <DrawerTrigger>
          <Button type="button" size="sm" variant="secondary">
            Add Company
          </Button>
        </DrawerTrigger>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Add a New Company</DrawerTitle>
          </DrawerHeader>
          <form className="flex gap-2 p-4 pb-0">
            {/* Company Name */}
            <Input placeholder="Company name" {...register("name")} />
  
            {/* Company Logo */}
            <Input
              type="file"
              accept="image/*"
              className=" file:text-gray-500"
              {...register("logo")}
            />
  
            {/* Add Button */}
            <Button
              type="button"
              onClick={handleSubmit(onSubmit)}
              variant="destructive"
              className="w-40"
            >
              Add
            </Button>
          </form>
          <DrawerFooter>
            {errors.name && <p className="text-red-500">{errors.name.message}</p>}
            {errors.logo && <p className="text-red-500">{errors.logo.message}</p>}
            {errorAddCompany?.message && (
              <p className="text-red-500">{errorAddCompany?.message}</p>
            )}
            {loadingAddCompany && <BarLoader width={"100%"} color="#36d7b7" />}
            <DrawerClose asChild>
              <Button type="button" variant="secondary">
                Cancel
              </Button>
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    );
  };
  
  export default AddCompanyDrawer;