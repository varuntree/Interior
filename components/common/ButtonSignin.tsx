import Link from "next/link";
import { Button } from "@/components/ui/button";

interface ButtonSigninProps {
  text?: string;
  extraStyle?: string;
}

const ButtonSignin = ({ text = "Login", extraStyle = "" }: ButtonSigninProps) => {
  return (
    <Button asChild className={extraStyle}>
      <Link href="/signin">
        {text}
      </Link>
    </Button>
  );
};

export default ButtonSignin;