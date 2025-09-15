import { RadialGlowBackground } from "@/components/radial-glow-background";
import SignInPage, { Testimonial } from "@/components/ui/sign-in";
import { useNavigate } from "react-router-dom";

const Login = () => {
  const sampleTestimonials: Testimonial[] = [];

  const navigate = useNavigate();

  return (
    <RadialGlowBackground>
      <SignInPage
        heroImageSrc="https://images.unsplash.com/photo-1642615835477-d303d7dc9ee9?w=2160&q=80"
        testimonials={sampleTestimonials}
        onSignIn={(e) => {
          e.preventDefault();
          const formData = new FormData(e.currentTarget);
          const email = String(formData.get("email") || "").trim();
          const password = String(formData.get("password") || "");
          if (email === "user@gmail.com" && password === "12345") {
            navigate("/home");
          } else {
            alert("Invalid credentials. Use user@gmail.com / 12345");
          }
        }}
        onGoogleSignIn={() => console.log("Continue with Google clicked")}
        onResetPassword={() => console.log("Reset Password clicked")}
        onCreateAccount={() => console.log("Create Account clicked")}
      />
    </RadialGlowBackground>
  );
};

export default Login;


