export const vertex = /* glsl */ `
varying vec3 vWorldPosition;
varying vec3 vNormal;
void main(){
 vec4 world = modelMatrix * vec4(position,1.0);
 vWorldPosition=world.xyz;
 vNormal=normalize(mat3(modelMatrix)*normal);
 gl_Position=projectionMatrix*viewMatrix*world;
}`;
export const environmentCode = /* glsl */ `
const float PI=3.141592653589793;
uniform int uEnvironment;
uniform float uEnvironmentRotation;
vec3 envRadiance(vec3 d){
 float c=cos(uEnvironmentRotation),s=sin(uEnvironmentRotation);
 d=vec3(c*d.x-s*d.z,d.y,s*d.x+c*d.z);
 if(uEnvironment==1){
   vec3 sky=mix(vec3(.38,.49,.64),vec3(.07,.19,.42),smoothstep(0.0,1.0,d.y));
   vec3 ground=vec3(.08,.09,.10);
   float sun=pow(max(dot(d,normalize(vec3(-.5,.7,.45))),0.0),100.0);
   return mix(ground,sky,smoothstep(-.12,.1,d.y))+vec3(3.5,3.1,2.4)*sun;
 }
 if(uEnvironment==2){
   vec3 sky=mix(vec3(1.0,.32,.095),vec3(.08,.075,.22),smoothstep(-.05,.8,d.y));
   float sun=pow(max(dot(d,normalize(vec3(-.8,.17,.4))),0.0),80.0);
   return mix(vec3(.055,.027,.026),sky,smoothstep(-.3,.03,d.y))+vec3(5.,2.2,.6)*sun;
 }
 vec3 base=mix(vec3(.025,.033,.045),vec3(.18,.21,.26),smoothstep(-.2,1.,d.y));
 // Original procedural softboxes, in linear radiance. No photography or borrowed assets.
 float panel=pow(max(dot(d,normalize(vec3(-.7,.7,.6))),0.),18.);
 float strip=pow(max(dot(d,normalize(vec3(.85,.3,-.45))),0.),35.);
 return base+vec3(3.3,3.,2.65)*panel+vec3(.9,1.2,1.8)*strip;
}
`;
export const fragment = /* glsl */ `
varying vec3 vWorldPosition;
varying vec3 vNormal;
uniform int uModel;
uniform vec3 uBaseColor;
uniform float uRoughness,uMetalness,uIor,uShininess,uSpecular,uLightIntensity,uEnvironmentIntensity;
uniform vec3 uLightDirection;
uniform bool uScaledLobes,uEnvironmentEnabled;
uniform int uComponent;
${environmentCode}
float sat(float x){return clamp(x,0.,1.);}
vec3 FSchlick(float vh,vec3 f0){return f0+(1.-f0)*pow(1.-sat(vh),5.);}
float Dggx(float nh){float a=max(uRoughness*uRoughness,.0025);float a2=a*a;float d=nh*nh*(a2-1.)+1.;return a2/(PI*d*d);}
float G1(float nx){float a=max(uRoughness*uRoughness,.0025);return 2.*nx/max(nx+sqrt(a*a+(1.-a*a)*nx*nx),.000001);}
vec3 F0(){float f=pow((uIor-1.)/(uIor+1.),2.);return mix(vec3(f),uBaseColor,uMetalness);}
float classicScale(){if(!uScaledLobes)return 1.;return uModel==1?(uShininess+2.)/(2.*PI):(uShininess+8.)/(8.*PI);}
void evaluate(vec3 N,vec3 V,vec3 L,out vec3 diffuse,out vec3 specular){
 float nl=max(dot(N,L),0.),nv=max(dot(N,V),0.);diffuse=vec3(0.);specular=vec3(0.);
 if(nl<=0.||nv<=0.)return;
 vec3 H=normalize(L+V);float nh=max(dot(N,H),0.),vh=max(dot(V,H),0.);
 diffuse=uBaseColor/PI;
 if(uModel==1){specular=vec3(uSpecular*classicScale()*pow(max(dot(reflect(-L,N),V),0.),uShininess));}
 if(uModel==2){specular=vec3(uSpecular*classicScale()*pow(nh,uShininess));}
 if(uModel==3){vec3 F=FSchlick(vh,F0());diffuse*=(1.-F)*(1.-uMetalness);specular=Dggx(nh)*G1(nl)*G1(nv)*F/max(4.*nl*nv,.000001);}
 diffuse*=nl;specular*=nl;
}
mat3 basis(vec3 n){vec3 up=abs(n.z)<.999?vec3(0.,0.,1.):vec3(1.,0.,0.);vec3 t=normalize(cross(up,n));return mat3(t,cross(n,t),n);}
vec2 sequence(int i,int count){return vec2((float(i)+.5)/float(count),fract(float(i)*.618033988749895));}
void environmentLight(vec3 N,vec3 V,out vec3 diffuse,out vec3 specular){
 diffuse=vec3(0.);specular=vec3(0.);
 mat3 bn=basis(N);vec3 f0=F0();float nv=max(dot(N,V),.00001);
 // Deterministic cosine-weighted integration of the diffuse hemisphere.
 for(int i=0;i<24;i++){
  vec2 u=sequence(i,24);float phi=2.*PI*u.y;float r=sqrt(u.x);
  vec3 L=bn*vec3(r*cos(phi),r*sin(phi),sqrt(1.-u.x));
  vec3 kd=uBaseColor;
  if(uModel==3)kd*=(1.-FSchlick(max(dot(V,normalize(V+L)),0.),f0))*(1.-uMetalness);
  diffuse+=kd*envRadiance(L)/24.;
 }
 if(uModel==0)return;
 mat3 br=basis(reflect(-V,N));
 // Separate lobe importance sampling: no fake ambient term or reflected screenshot.
 for(int i=0;i<48;i++){
  vec2 u=sequence(i,48);float phi=2.*PI*u.y;vec3 L;vec3 weight;
  if(uModel==1){
   float z=pow(1.-u.x,1./(uShininess+1.));float r=sqrt(max(0.,1.-z*z));
   L=br*vec3(r*cos(phi),r*sin(phi),z);
   weight=vec3(uSpecular*classicScale()*2.*PI/(uShininess+1.)*max(dot(N,L),0.));
  }else{
   float a=max(uRoughness*uRoughness,.0025);
   float z=uModel==3?sqrt((1.-u.x)/(1.+(a*a-1.)*u.x)):pow(1.-u.x,1./(uShininess+2.));
   float r=sqrt(max(0.,1.-z*z));vec3 H=bn*vec3(r*cos(phi),r*sin(phi),z);
   float vh=dot(V,H);L=reflect(-V,H);float nl=dot(N,L);
   if(vh<=0.||nl<=0.)continue;
   if(uModel==3)weight=FSchlick(vh,f0)*G1(nl)*G1(nv)*vh/max(nv*z,.000001);
   else weight=vec3(uSpecular*classicScale()*8.*PI*vh*nl/((uShininess+2.)*max(z,.000001)));
  }
  specular+=envRadiance(L)*weight/48.;
 }
}
void main(){
 vec3 N=normalize(vNormal),V=normalize(cameraPosition-vWorldPosition),d,s;
 evaluate(N,V,normalize(uLightDirection),d,s);d*=uLightIntensity;s*=uLightIntensity;
 if(uEnvironmentEnabled){vec3 ed,es;environmentLight(N,V,ed,es);d+=ed*uEnvironmentIntensity;s+=es*uEnvironmentIntensity;}
 vec3 result=uComponent==1?d:uComponent==2?s:d+s;
 gl_FragColor=vec4(max(result,vec3(0.)),1.);
 #include <tonemapping_fragment>
 #include <colorspace_fragment>
}`;
export const backgroundFragment = /* glsl */ `
varying vec3 vWorldPosition;
${environmentCode}
uniform float uSkyExposure;
void main(){vec3 d=normalize(vWorldPosition-cameraPosition);gl_FragColor=vec4(envRadiance(d)*uSkyExposure,1.);
#include <tonemapping_fragment>
#include <colorspace_fragment>
}`;
