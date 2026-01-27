--
-- PostgreSQL database dump
--

\restrict 5orsyrnbPpxxd1P9SkiUMWiAaiJncoE1qsADojJmb7r11FShrUvxdDnYo2nojSy

-- Dumped from database version 13.22
-- Dumped by pg_dump version 17.6

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: postgres
--

-- *not* creating schema, since initdb creates it


ALTER SCHEMA public OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: Chat; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Chat" (
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    id integer NOT NULL,
    title text,
    "userId" integer NOT NULL
);


ALTER TABLE public."Chat" OWNER TO postgres;

--
-- Name: ChatMessage; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."ChatMessage" (
    role text NOT NULL,
    content text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    id integer NOT NULL,
    "chatId" integer NOT NULL
);


ALTER TABLE public."ChatMessage" OWNER TO postgres;

--
-- Name: ChatMessage_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."ChatMessage_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."ChatMessage_id_seq" OWNER TO postgres;

--
-- Name: ChatMessage_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."ChatMessage_id_seq" OWNED BY public."ChatMessage".id;


--
-- Name: Chat_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."Chat_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."Chat_id_seq" OWNER TO postgres;

--
-- Name: Chat_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."Chat_id_seq" OWNED BY public."Chat".id;


--
-- Name: Course; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Course" (
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    code text NOT NULL,
    duration integer,
    students integer NOT NULL,
    id integer NOT NULL,
    department text,
    level integer,
    title text DEFAULT 'Untitled'::text NOT NULL
);


ALTER TABLE public."Course" OWNER TO postgres;

--
-- Name: Course_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."Course_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."Course_id_seq" OWNER TO postgres;

--
-- Name: Course_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."Course_id_seq" OWNED BY public."Course".id;


--
-- Name: Hall; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Hall" (
    capacity integer NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    name text NOT NULL,
    id integer NOT NULL
);


ALTER TABLE public."Hall" OWNER TO postgres;

--
-- Name: Hall_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."Hall_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."Hall_id_seq" OWNER TO postgres;

--
-- Name: Hall_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."Hall_id_seq" OWNED BY public."Hall".id;


--
-- Name: Supervisor; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Supervisor" (
    email text NOT NULL,
    id integer NOT NULL,
    department text,
    "fullName" text NOT NULL,
    phone text
);


ALTER TABLE public."Supervisor" OWNER TO postgres;

--
-- Name: Supervisor_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."Supervisor_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."Supervisor_id_seq" OWNER TO postgres;

--
-- Name: Supervisor_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."Supervisor_id_seq" OWNED BY public."Supervisor".id;


--
-- Name: Timetable; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Timetable" (
    id integer NOT NULL,
    "courseCodeId" integer,
    date text NOT NULL,
    day text NOT NULL,
    "endTime" text NOT NULL,
    "groupedCourseCodes" text NOT NULL,
    "groupedHallNames" text NOT NULL,
    "hallId" integer,
    "startTime" text NOT NULL,
    "timeSlot" text NOT NULL
);


ALTER TABLE public."Timetable" OWNER TO postgres;

--
-- Name: Timetable_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."Timetable_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."Timetable_id_seq" OWNER TO postgres;

--
-- Name: Timetable_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."Timetable_id_seq" OWNED BY public."Timetable".id;


--
-- Name: User; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."User" (
    id integer NOT NULL,
    email text NOT NULL,
    password text NOT NULL,
    "firstName" text NOT NULL,
    "lastName" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "isVerified" boolean DEFAULT false NOT NULL,
    "verificationToken" text,
    "verificationTokenExpiry" timestamp(3) without time zone,
    "rememberToken" text
);


ALTER TABLE public."User" OWNER TO postgres;

--
-- Name: User_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."User_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."User_id_seq" OWNER TO postgres;

--
-- Name: User_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."User_id_seq" OWNED BY public."User".id;


--
-- Name: _TimetableSupervisors; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."_TimetableSupervisors" (
    "A" integer NOT NULL,
    "B" integer NOT NULL
);


ALTER TABLE public."_TimetableSupervisors" OWNER TO postgres;

--
-- Name: _prisma_migrations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public._prisma_migrations (
    id character varying(36) NOT NULL,
    checksum character varying(64) NOT NULL,
    finished_at timestamp with time zone,
    migration_name character varying(255) NOT NULL,
    logs text,
    rolled_back_at timestamp with time zone,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    applied_steps_count integer DEFAULT 0 NOT NULL
);


ALTER TABLE public._prisma_migrations OWNER TO postgres;

--
-- Name: Chat id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Chat" ALTER COLUMN id SET DEFAULT nextval('public."Chat_id_seq"'::regclass);


--
-- Name: ChatMessage id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."ChatMessage" ALTER COLUMN id SET DEFAULT nextval('public."ChatMessage_id_seq"'::regclass);


--
-- Name: Course id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Course" ALTER COLUMN id SET DEFAULT nextval('public."Course_id_seq"'::regclass);


--
-- Name: Hall id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Hall" ALTER COLUMN id SET DEFAULT nextval('public."Hall_id_seq"'::regclass);


--
-- Name: Supervisor id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Supervisor" ALTER COLUMN id SET DEFAULT nextval('public."Supervisor_id_seq"'::regclass);


--
-- Name: Timetable id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Timetable" ALTER COLUMN id SET DEFAULT nextval('public."Timetable_id_seq"'::regclass);


--
-- Name: User id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."User" ALTER COLUMN id SET DEFAULT nextval('public."User_id_seq"'::regclass);


--
-- Data for Name: Chat; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Chat" ("createdAt", "updatedAt", id, title, "userId") FROM stdin;
\.


--
-- Data for Name: ChatMessage; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."ChatMessage" (role, content, "createdAt", id, "chatId") FROM stdin;
\.


--
-- Data for Name: Course; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Course" ("createdAt", "updatedAt", code, duration, students, id, department, level, title) FROM stdin;
2025-10-13 05:01:02.107	2025-10-13 05:01:02.107	B10014	\N	140	156	Biology	100	Biotechnology
2025-10-13 05:01:02.12	2025-10-13 05:01:02.12	M40047	\N	140	157	Mathematics	400	Probability Theory
2025-10-13 05:01:02.122	2025-10-13 05:01:02.122	E20089	\N	120	158	Engineering	200	Engineering Mechanics
2025-10-13 05:01:02.124	2025-10-13 05:01:02.124	G10053	\N	141	159	Geology	100	Mineralogy
2025-10-13 05:01:02.126	2025-10-13 05:01:02.126	C10001	\N	127	160	Chemistry	100	Industrial Chemistry
2025-10-13 05:01:02.128	2025-10-13 05:01:02.128	ES20036	\N	109	161	Environmental Science	200	Environmental Policy
2025-10-13 05:01:02.13	2025-10-13 05:01:02.13	B40092	\N	139	162	Biology	400	Immunology
2025-10-13 05:01:02.133	2025-10-13 05:01:02.133	P10064	\N	124	163	Physics	100	Relativity
2025-10-13 05:01:02.136	2025-10-13 05:01:02.136	CS40009	\N	130	164	Computer Science	400	Software Engineering
2025-10-13 05:01:02.138	2025-10-13 05:01:02.138	M30003	\N	130	165	Mathematics	300	Topology
2025-10-13 05:01:02.139	2025-10-13 05:01:02.139	E10082	\N	70	166	Engineering	100	Structural Analysis
2025-10-13 05:01:02.141	2025-10-13 05:01:02.141	G40046	\N	3	167	Geology	400	Sedimentology
2025-10-13 05:01:02.143	2025-10-13 05:01:02.143	E20016	\N	39	168	Engineering	200	Power Systems
2025-10-13 05:01:02.145	2025-10-13 05:01:02.145	CS30015	\N	75	169	Computer Science	300	Database Systems
2025-10-13 05:01:02.148	2025-10-13 05:01:02.148	G10065	\N	21	170	Geology	100	Geochemistry
2025-10-13 05:01:02.15	2025-10-13 05:01:02.15	G20049	\N	24	171	Geology	200	Geophysics
2025-10-13 05:01:02.153	2025-10-13 05:01:02.153	B20019	\N	79	172	Biology	200	Immunology
2025-10-13 05:01:02.155	2025-10-13 05:01:02.155	C30062	\N	57	173	Chemistry	300	Biochemistry
2025-10-13 05:01:02.157	2025-10-13 05:01:02.157	G10077	\N	10	174	Geology	100	Petrology
2025-10-13 05:01:02.159	2025-10-13 05:01:02.159	E10087	\N	79	175	Engineering	100	Control Systems
2025-10-13 05:01:02.161	2025-10-13 05:01:02.161	CS20092	\N	37	176	Computer Science	200	Algorithms
2025-10-13 05:01:02.163	2025-10-13 05:01:02.163	CS30082	\N	94	177	Computer Science	300	Cybersecurity
2025-10-13 05:01:02.165	2025-10-13 05:01:02.165	ES10034	\N	37	178	Environmental Science	100	Renewable Energy
2025-10-13 05:01:02.167	2025-10-13 05:01:02.167	E40012	\N	36	179	Engineering	400	Engineering Mechanics
2025-10-13 05:01:02.169	2025-10-13 05:01:02.169	M10090	\N	85	180	Mathematics	100	Discrete Mathematics
2025-10-13 05:01:02.171	2025-10-13 05:01:02.171	B10035	\N	50	181	Biology	100	Physiology
2025-10-13 05:01:02.173	2025-10-13 05:01:02.173	E40080	\N	58	182	Engineering	400	Power Systems
2025-10-13 05:01:02.175	2025-10-13 05:01:02.175	E20061	\N	45	183	Engineering	200	Fluid Mechanics
2025-10-13 05:01:02.177	2025-10-13 05:01:02.177	B40076	\N	7	184	Biology	400	Plant Biology
2025-10-13 05:01:02.179	2025-10-13 05:01:02.179	C20079	\N	53	185	Chemistry	200	Analytical Chemistry
2025-10-13 05:01:02.181	2025-10-13 05:01:02.181	CS40025	\N	44	186	Computer Science	400	Machine Learning
2025-10-13 05:01:02.183	2025-10-13 05:01:02.183	C10035	\N	41	187	Chemistry	100	Industrial Chemistry
2025-10-13 05:01:02.187	2025-10-13 05:01:02.187	P10012	\N	61	188	Physics	100	Solid State Physics
2025-10-13 05:01:02.189	2025-10-13 05:01:02.189	E10072	\N	48	189	Engineering	100	Power Systems
2025-10-13 05:01:02.191	2025-10-13 05:01:02.191	E20001	\N	11	190	Engineering	200	Power Systems
2025-10-13 05:01:02.192	2025-10-13 05:01:02.192	E40007	\N	66	191	Engineering	400	Structural Analysis
2025-10-13 05:01:02.194	2025-10-13 05:01:02.194	G40019	\N	53	192	Geology	400	Petrology
2025-10-13 05:01:02.196	2025-10-13 05:01:02.196	P20069	\N	58	193	Physics	200	Astrophysics
2025-10-13 05:01:02.199	2025-10-13 05:01:02.199	G40031	\N	32	194	Geology	400	Paleontology
2025-10-13 05:01:02.201	2025-10-13 05:01:02.201	B10044	\N	70	195	Biology	100	Cell Biology
2025-10-13 05:01:02.203	2025-10-13 05:01:02.203	E30004	\N	99	196	Engineering	300	Structural Analysis
2025-10-13 05:01:02.206	2025-10-13 05:01:02.206	P20032	\N	85	197	Physics	200	Nuclear Physics
2025-10-13 05:01:02.208	2025-10-13 05:01:02.208	G20053	\N	39	198	Geology	200	Hydrogeology
2025-10-13 05:01:02.21	2025-10-13 05:01:02.21	CS30038	\N	37	199	Computer Science	300	Human-Computer Interaction
2025-10-13 05:01:02.212	2025-10-13 05:01:02.212	ES10088	\N	34	200	Environmental Science	100	Conservation Biology
2025-10-13 05:01:02.214	2025-10-13 05:01:02.214	CS30058	\N	47	201	Computer Science	300	Introduction to Computer Science
2025-10-13 05:01:02.218	2025-10-13 05:01:02.218	CS40029	\N	41	202	Computer Science	400	Introduction to Computer Science
2025-10-13 05:01:02.22	2025-10-13 05:01:02.22	E40064	\N	6	203	Engineering	400	Digital Electronics
2025-10-13 05:01:02.222	2025-10-13 05:01:02.222	ES10071	\N	78	204	Environmental Science	100	Environmental Policy
2025-10-13 05:01:02.225	2025-10-13 05:01:02.225	CS30006	\N	12	205	Computer Science	300	Software Engineering
2025-10-13 05:01:02.228	2025-10-13 05:01:02.228	P20025	\N	59	206	Physics	200	Solid State Physics
2025-10-13 05:01:02.23	2025-10-13 05:01:02.23	M10022	\N	2	207	Mathematics	100	Abstract Algebra
2025-10-13 05:01:02.233	2025-10-13 05:01:02.233	G10082	\N	61	208	Geology	100	Geochemistry
2025-10-13 05:01:02.235	2025-10-13 05:01:02.235	CS10018	\N	72	209	Computer Science	100	Programming Languages
2025-10-13 05:01:02.238	2025-10-13 05:01:02.238	CS40019	\N	30	210	Computer Science	400	Software Engineering
2025-10-13 05:01:02.241	2025-10-13 05:01:02.241	G10070	\N	82	211	Geology	100	Paleontology
2025-10-13 05:01:02.243	2025-10-13 05:01:02.243	CS20034	\N	85	212	Computer Science	200	Data Structures
2025-10-13 05:01:02.246	2025-10-13 05:01:02.246	C20015	\N	77	213	Chemistry	200	Analytical Chemistry
2025-10-13 05:01:02.249	2025-10-13 05:01:02.249	P20081	\N	57	214	Physics	200	General Physics
2025-10-13 05:01:02.252	2025-10-13 05:01:02.252	M20058	\N	14	215	Mathematics	200	Discrete Mathematics
2025-10-13 05:01:02.255	2025-10-13 05:01:02.255	M40014	\N	56	216	Mathematics	400	Differential Equations
2025-10-13 05:01:02.257	2025-10-13 05:01:02.257	ES40081	\N	96	217	Environmental Science	400	Conservation Biology
2025-10-13 05:01:02.259	2025-10-13 05:01:02.259	B30059	\N	2	218	Biology	300	Genetics
2025-10-13 05:01:02.261	2025-10-13 05:01:02.261	P20024	\N	86	219	Physics	200	Particle Physics
2025-10-13 05:01:02.263	2025-10-13 05:01:02.263	M20059	\N	70	220	Mathematics	200	Real Analysis
2025-10-13 05:01:02.266	2025-10-13 05:01:02.266	C30057	\N	59	221	Chemistry	300	Analytical Chemistry
2025-10-13 05:01:02.268	2025-10-13 05:01:02.268	G40092	\N	55	222	Geology	400	Petrology
2025-10-13 05:01:02.27	2025-10-13 05:01:02.27	G40059	\N	93	223	Geology	400	Geophysics
2025-10-13 05:01:02.273	2025-10-13 05:01:02.273	B40052	\N	18	224	Biology	400	Neuroscience
2025-10-13 05:01:02.275	2025-10-13 05:01:02.275	CS20002	\N	42	225	Computer Science	200	Software Engineering
2025-10-13 05:01:02.277	2025-10-13 05:01:02.277	CS10011	\N	7	226	Computer Science	100	Data Structures
2025-10-13 05:01:02.279	2025-10-13 05:01:02.279	C20033	\N	84	227	Chemistry	200	Industrial Chemistry
2025-10-13 05:01:02.281	2025-10-13 05:01:02.281	E10079	\N	24	228	Engineering	100	Fluid Mechanics
2025-10-13 05:01:02.283	2025-10-13 05:01:02.283	C20074	\N	53	229	Chemistry	200	Biochemistry
2025-10-13 05:01:02.285	2025-10-13 05:01:02.285	E30035	\N	15	230	Engineering	300	Materials Science
2025-10-13 05:01:02.287	2025-10-13 05:01:02.287	ES30020	\N	8	231	Environmental Science	300	Environmental Science
2025-10-13 05:01:02.289	2025-10-13 05:01:02.289	G40040	\N	20	232	Geology	400	Mineralogy
2025-10-13 05:01:02.291	2025-10-13 05:01:02.291	P10054	\N	42	233	Physics	100	Thermodynamics
2025-10-13 05:01:02.293	2025-10-13 05:01:02.293	B40094	\N	34	234	Biology	400	Physiology
2025-10-13 05:01:02.295	2025-10-13 05:01:02.295	G30057	\N	6	235	Geology	300	Sedimentology
2025-10-13 05:01:02.297	2025-10-13 05:01:02.297	M30090	\N	48	236	Mathematics	300	Real Analysis
2025-10-13 05:01:02.299	2025-10-13 05:01:02.299	C30075	\N	86	237	Chemistry	300	Environmental Chemistry
2025-10-13 05:01:02.301	2025-10-13 05:01:02.301	B30071	\N	95	238	Biology	300	Microbiology
2025-10-13 05:01:02.303	2025-10-13 05:01:02.303	M10008	\N	95	239	Mathematics	100	Vector Calculus
2025-10-13 05:01:02.305	2025-10-13 05:01:02.305	P20060	\N	57	240	Physics	200	Relativity
2025-10-13 05:01:02.307	2025-10-13 05:01:02.307	G10033	\N	85	241	Geology	100	Sedimentology
2025-10-13 05:01:02.31	2025-10-13 05:01:02.31	M30091	\N	52	242	Mathematics	300	Complex Analysis
2025-10-13 05:01:02.313	2025-10-13 05:01:02.313	E40065	\N	11	243	Engineering	400	Power Systems
2025-10-13 05:01:02.318	2025-10-13 05:01:02.318	B10045	\N	20	244	Biology	100	Plant Biology
2025-10-13 05:01:02.322	2025-10-13 05:01:02.322	C20041	\N	83	245	Chemistry	200	Physical Chemistry
2025-10-13 05:01:02.326	2025-10-13 05:01:02.326	CS10047	\N	51	246	Computer Science	100	Human-Computer Interaction
2025-10-13 05:01:02.33	2025-10-13 05:01:02.33	M20011	\N	39	247	Mathematics	200	Linear Algebra
2025-10-13 05:01:02.334	2025-10-13 05:01:02.334	C10018	\N	72	248	Chemistry	100	Environmental Chemistry
2025-10-13 05:01:02.338	2025-10-13 05:01:02.338	ES20016	\N	83	249	Environmental Science	200	Conservation Biology
2025-10-13 05:01:02.342	2025-10-13 05:01:02.342	M10099	\N	40	250	Mathematics	100	Differential Equations
2025-10-13 05:01:02.345	2025-10-13 05:01:02.345	C30006	\N	83	251	Chemistry	300	Physical Chemistry
2025-10-13 05:01:02.349	2025-10-13 05:01:02.349	P30004	\N	85	252	Physics	300	Particle Physics
2025-10-13 05:01:02.352	2025-10-13 05:01:02.352	ES10085	\N	64	253	Environmental Science	100	Conservation Biology
2025-10-13 05:01:02.356	2025-10-13 05:01:02.356	M40031	\N	75	254	Mathematics	400	Vector Calculus
2025-10-13 05:01:02.359	2025-10-13 05:01:02.359	C10006	\N	54	255	Chemistry	100	Industrial Chemistry
2025-10-13 05:01:02.362	2025-10-13 05:01:02.362	G30067	\N	94	256	Geology	300	Sedimentology
2025-10-13 05:01:02.366	2025-10-13 05:01:02.366	P30034	\N	72	257	Physics	300	Optics
2025-10-13 05:01:02.369	2025-10-13 05:01:02.369	ES20061	\N	81	258	Environmental Science	200	Climate Change
2025-10-13 05:01:02.373	2025-10-13 05:01:02.373	M30021	\N	85	259	Mathematics	300	Abstract Algebra
2025-10-13 05:01:02.376	2025-10-13 05:01:02.376	G40095	\N	43	260	Geology	400	Hydrogeology
2025-10-13 05:01:02.381	2025-10-13 05:01:02.381	M20046	\N	41	261	Mathematics	200	Probability Theory
2025-10-13 05:01:02.385	2025-10-13 05:01:02.385	G20040	\N	19	262	Geology	200	Paleontology
2025-10-13 05:01:02.388	2025-10-13 05:01:02.388	G40022	\N	40	263	Geology	400	Geochemistry
2025-10-13 05:01:02.391	2025-10-13 05:01:02.391	ES10064	\N	40	264	Environmental Science	100	Conservation Biology
2025-10-13 05:01:02.394	2025-10-13 05:01:02.394	G10071	\N	94	265	Geology	100	Sedimentology
2025-10-13 05:01:02.398	2025-10-13 05:01:02.398	CS10094	\N	10	266	Computer Science	100	Programming Languages
2025-10-13 05:01:02.402	2025-10-13 05:01:02.402	M40065	\N	91	267	Mathematics	400	Abstract Algebra
2025-10-13 05:01:02.406	2025-10-13 05:01:02.406	P30011	\N	58	268	Physics	300	Astrophysics
2025-10-13 05:01:02.409	2025-10-13 05:01:02.409	E10075	\N	70	269	Engineering	100	Control Systems
2025-10-13 05:01:02.412	2025-10-13 05:01:02.412	ES40042	\N	95	270	Environmental Science	400	Toxicology
2025-10-13 05:01:02.416	2025-10-13 05:01:02.416	M20061	\N	31	271	Mathematics	200	Game Theory
2025-10-13 05:01:02.42	2025-10-13 05:01:02.42	B30002	\N	43	272	Biology	300	Evolutionary Biology
2025-10-13 05:01:02.423	2025-10-13 05:01:02.423	C30047	\N	32	273	Chemistry	300	Inorganic Chemistry
\.


--
-- Data for Name: Hall; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Hall" (capacity, "createdAt", "updatedAt", name, id) FROM stdin;
\.


--
-- Data for Name: Supervisor; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Supervisor" (email, id, department, "fullName", phone) FROM stdin;
\.


--
-- Data for Name: Timetable; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Timetable" (id, "courseCodeId", date, day, "endTime", "groupedCourseCodes", "groupedHallNames", "hallId", "startTime", "timeSlot") FROM stdin;
\.


--
-- Data for Name: User; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."User" (id, email, password, "firstName", "lastName", "createdAt", "updatedAt", "isVerified", "verificationToken", "verificationTokenExpiry", "rememberToken") FROM stdin;
1	clintonp382@gmail.com	$2b$10$mIDSSib5HR55rkoXAM3pWOzOp60UcIfdBzwYDtY2IAUwdRfXed0uu	Clinton	Paul	2025-09-26 05:05:43.498	2025-09-26 05:05:43.498	t	\N	\N	\N
\.


--
-- Data for Name: _TimetableSupervisors; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."_TimetableSupervisors" ("A", "B") FROM stdin;
\.


--
-- Data for Name: _prisma_migrations; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) FROM stdin;
0a1e88b4-bc3b-44af-bc73-2ceaa57059cb	fc21bad728fbc66a7a555848dad641900a60e96af045fdd9bdeef37ed754947c	2025-09-26 06:03:27.443484+01	20250701091920_add_title_with_default	\N	\N	2025-09-26 06:03:27.440678+01	1
a6ce2386-fa3c-478f-bf3c-d57ede1f22b9	44d9613f0c3ddcaae353ba7fc9c856a37422a7c9bb1734c23d058ad6539f104c	2025-09-26 06:03:27.008375+01	20250427014817_init	\N	\N	2025-09-26 06:03:26.988109+01	1
e31f9710-76f1-4b52-876a-e9f86bfc9375	08b4d9835c5329802bd760e00f0227a64d26708ac4e774850c5b6aa30dea175b	2025-09-26 06:03:27.396522+01	20250629201900_add_remember_token	\N	\N	2025-09-26 06:03:27.393808+01	1
ab1bee34-6464-4cd4-b56c-1408d7ec06e8	84f36fe214fb38078fcb4fc30957ad89115918a65fc897c4d21e62b16168128d	2025-09-26 06:03:27.029703+01	20250511013632_add_halls	\N	\N	2025-09-26 06:03:27.00993+01	1
997996ad-a8d7-4661-a6a0-9b06f4df9946	8fa3caf99c977db3625326c279680c7afbe2707428fb061296a6dd6c9236fb68	2025-09-26 06:03:27.050563+01	20250514094422_add_supervisor	\N	\N	2025-09-26 06:03:27.031256+01	1
4a27bc9f-6b0d-4e88-ba2f-a268df28601c	a70462a0c02c34d69728046e37e7bb61d7ed58b2fc8ba70699c5e240ffc928b8	2025-09-26 06:03:27.069599+01	20250516000011_add_timetable_model	\N	\N	2025-09-26 06:03:27.051897+01	1
b2fad9b9-d58a-4f86-b2dc-8852ad3c083a	7e49bbdfdeab22c87e3d32484215f091bd0b4fa69c726ef8c76ba3b3ef8d5761	2025-09-26 06:03:27.402484+01	20250630005812_update_chat_schema	\N	\N	2025-09-26 06:03:27.397167+01	1
bfabcf99-759e-4818-99dd-0e3a5e3527f0	3fa8d1c6d7577592cae28f24598ba0026b51c3ae5ec6491209739021246125c6	2025-09-26 06:03:27.079504+01	20250516024043_add_supervisors_to_timetable	\N	\N	2025-09-26 06:03:27.071033+01	1
9f8c7ec0-34d3-4567-9e21-58a50cbf5025	8b921db16e77cc93e8434626859d8ec47a687a89d1ead9bcb78e9a3e23f1e474	2025-09-26 06:03:27.134447+01	20250516171432_add_supervisor_id	\N	\N	2025-09-26 06:03:27.080863+01	1
46448f6f-b430-4ae1-b759-444b19c7d890	c4138dabceea53ef84964e218c7271bbfebb10640e5da79c5d832a211af5bcd9	2025-09-26 06:03:27.140757+01	20250519152942_add_supervisor_table	\N	\N	2025-09-26 06:03:27.13578+01	1
a4181f50-a317-49e9-bc56-86e4469116cd	ad5ed55d8987661003c806619b0c2d88693da69135ddd44329e446b5b816381d	2025-09-26 06:03:27.406934+01	20250630010156_fix_chat_schema	\N	\N	2025-09-26 06:03:27.403216+01	1
7100359a-d60a-4b40-943c-845018332f14	007387ca4085f449c6cd12b7416551e0f4e0a255db61c63e7872ddb46667ce62	2025-09-26 06:03:27.147174+01	20250523170354_add_grouped_codes	\N	\N	2025-09-26 06:03:27.14229+01	1
49749e3b-1a14-4e6f-9252-cb418958e310	ecf7cf552b463438b2ee8436f04e752d8416bb6e495fade2dd25bd41de813359	2025-09-26 06:03:27.182943+01	20250623172138_create_chat_and_chatmessage_tables	\N	\N	2025-09-26 06:03:27.148614+01	1
f32790e9-7d62-4a04-b1ba-234a0793ac54	04b0a09ba6e5926aaef6df1b99ee1c774266af8e5edb6b40e91f43c76823a748	2025-09-26 06:03:27.203076+01	20250628221945_add_users_table	\N	\N	2025-09-26 06:03:27.18477+01	1
d14b511c-ae68-43b5-aaf4-7c41267a263b	2eabac0e33b1514526234c36fb6c17f8543be91441126840d0c78770e8b672a1	2025-09-26 06:03:27.412808+01	20250630115056_add_userid_to_chat	\N	\N	2025-09-26 06:03:27.407686+01	1
4182e78d-3733-4857-94f4-222153836dac	23f0406a826f6c3dbd85f3b560ac8a7b9b1f7deb5e05681462a80a8a698cc81b	2025-09-26 06:03:27.211755+01	20250628231346_add_email_verification_fields	\N	\N	2025-09-26 06:03:27.203978+01	1
14e68dea-e1b1-41ea-a514-6efec0b59a29	228f975118db04bad5629e167ce9ca8978fb2eafa5983b2f5306bfb1c23382ca	2025-09-26 06:03:27.323546+01	20250629163118_add_user_table_constraints	\N	\N	2025-09-26 06:03:27.212804+01	1
ff5de5c9-7b36-4281-b728-57427c100b0e	864b00309bf391fe4b46ecbbc5d8d95dddd8359e9eb23654f3d667ae77bef9fa	2025-09-26 06:03:27.393046+01	20250629192324_add_remember_token	\N	\N	2025-09-26 06:03:27.324366+01	1
104837ee-a75e-4946-8089-aa4b2a81132c	21c5e8c29838f5144b4838dbf6b52995ad030117c60d02d43965924d61e16138	2025-09-26 06:03:27.416286+01	20250630190223_updated_course_model	\N	\N	2025-09-26 06:03:27.413575+01	1
b849d951-55d3-413a-a55d-dfeaffc4d628	c9451eb0bd05959723af0784957dd087edde79baebfd7a141180e1a8e77d9906	2025-09-26 06:03:27.419523+01	20250630190726_add_level_and_department_to_course	\N	\N	2025-09-26 06:03:27.417001+01	1
5c97ae34-a15d-44c3-9880-ab41107f63f9	c361f5ea4ac0420441b36701418f3da2e9667b3f360826c6b849e093f920fb3c	2025-09-26 06:03:27.435595+01	20250701025627_fix_missing_relations	\N	\N	2025-09-26 06:03:27.420195+01	1
b0515aa6-7165-42b1-82e6-e7394678d20e	776a5c330b501184d7e3ed3df24cb636bcae0f85ee749942fbed566b8c8c6010	2025-09-26 06:03:27.439744+01	20250701030441_rename_name_to_full_name	\N	\N	2025-09-26 06:03:27.436296+01	1
\.


--
-- Name: ChatMessage_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."ChatMessage_id_seq"', 1, false);


--
-- Name: Chat_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."Chat_id_seq"', 1, false);


--
-- Name: Course_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."Course_id_seq"', 273, true);


--
-- Name: Hall_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."Hall_id_seq"', 1, true);


--
-- Name: Supervisor_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."Supervisor_id_seq"', 1, false);


--
-- Name: Timetable_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."Timetable_id_seq"', 1, false);


--
-- Name: User_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."User_id_seq"', 1, true);


--
-- Name: ChatMessage ChatMessage_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."ChatMessage"
    ADD CONSTRAINT "ChatMessage_pkey" PRIMARY KEY (id);


--
-- Name: Chat Chat_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Chat"
    ADD CONSTRAINT "Chat_pkey" PRIMARY KEY (id);


--
-- Name: Course Course_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Course"
    ADD CONSTRAINT "Course_pkey" PRIMARY KEY (id);


--
-- Name: Hall Hall_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Hall"
    ADD CONSTRAINT "Hall_pkey" PRIMARY KEY (id);


--
-- Name: Supervisor Supervisor_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Supervisor"
    ADD CONSTRAINT "Supervisor_pkey" PRIMARY KEY (id);


--
-- Name: Timetable Timetable_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Timetable"
    ADD CONSTRAINT "Timetable_pkey" PRIMARY KEY (id);


--
-- Name: User User_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_pkey" PRIMARY KEY (id);


--
-- Name: _TimetableSupervisors _TimetableSupervisors_AB_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."_TimetableSupervisors"
    ADD CONSTRAINT "_TimetableSupervisors_AB_pkey" PRIMARY KEY ("A", "B");


--
-- Name: _prisma_migrations _prisma_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public._prisma_migrations
    ADD CONSTRAINT _prisma_migrations_pkey PRIMARY KEY (id);


--
-- Name: Course_code_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "Course_code_key" ON public."Course" USING btree (code);


--
-- Name: Hall_name_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "Hall_name_key" ON public."Hall" USING btree (name);


--
-- Name: Supervisor_email_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "Supervisor_email_key" ON public."Supervisor" USING btree (email);


--
-- Name: User_email_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "User_email_key" ON public."User" USING btree (email);


--
-- Name: _TimetableSupervisors_B_index; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "_TimetableSupervisors_B_index" ON public."_TimetableSupervisors" USING btree ("B");


--
-- Name: ChatMessage ChatMessage_chatId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."ChatMessage"
    ADD CONSTRAINT "ChatMessage_chatId_fkey" FOREIGN KEY ("chatId") REFERENCES public."Chat"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Chat Chat_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Chat"
    ADD CONSTRAINT "Chat_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Timetable Timetable_courseCodeId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Timetable"
    ADD CONSTRAINT "Timetable_courseCodeId_fkey" FOREIGN KEY ("courseCodeId") REFERENCES public."Course"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Timetable Timetable_hallId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Timetable"
    ADD CONSTRAINT "Timetable_hallId_fkey" FOREIGN KEY ("hallId") REFERENCES public."Hall"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: _TimetableSupervisors _TimetableSupervisors_A_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."_TimetableSupervisors"
    ADD CONSTRAINT "_TimetableSupervisors_A_fkey" FOREIGN KEY ("A") REFERENCES public."Supervisor"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: _TimetableSupervisors _TimetableSupervisors_B_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."_TimetableSupervisors"
    ADD CONSTRAINT "_TimetableSupervisors_B_fkey" FOREIGN KEY ("B") REFERENCES public."Timetable"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: postgres
--

REVOKE USAGE ON SCHEMA public FROM PUBLIC;
GRANT ALL ON SCHEMA public TO PUBLIC;


--
-- PostgreSQL database dump complete
--

\unrestrict 5orsyrnbPpxxd1P9SkiUMWiAaiJncoE1qsADojJmb7r11FShrUvxdDnYo2nojSy

