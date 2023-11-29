import { cloneElement, ReactElement } from "react";
import { useRouter } from "next/router";
import Link, { LinkProps } from "next/link";

interface ActiveLinkProps extends LinkProps {
  children: ReactElement;
  activeClassName: string;
}

export function ActiveLink({ children, activeClassName, ...rest }: ActiveLinkProps) {

  const { asPath } = useRouter();

  const className = asPath === rest.href ? activeClassName : "";

  /* recebo todos os atributos de Link (href) */
  
    /* cloneElement: consigo clonar um elemento e modificar os atributos 
       children: minha tag <a> */
  return (
    <Link {...rest}> 
      {cloneElement(children, { 
        className
      })}
    </Link>
  )
}