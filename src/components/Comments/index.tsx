import { useEffect } from "react";

export default function Comments(){

    useEffect(() => {

        const script = document.createElement("script");
        const anchor = document.getElementById("inject-comments-for-uterances");
        script.setAttribute("src", "https://utteranc.es/client.js");
        script.setAttribute("crossorigin","anonymous");
        script.setAttribute("async", 'true');
        script.setAttribute("repo", "hitaloalvess/spacetraveling-blog-comments");
        script.setAttribute("issue-term", "pathname");
        script.setAttribute( "theme", "github-dark");
        anchor.appendChild(script);
        
  },[])

    return(
        <div id="inject-comments-for-uterances"></div>
    )//ALTERAR PARA O USEEFFECT SER RENDERIZADO TODA VEZ QUE A PATH MUDAR
}