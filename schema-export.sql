--
-- PostgreSQL database dump
--

\restrict hLglrcPOZyh9g7Yw9dyb8x29s6d6bNLjki9Su3z02yIZu8Si9QQ7Pzewbs1whKa

-- Dumped from database version 17.6
-- Dumped by pg_dump version 18.4

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
-- Name: public; Type: SCHEMA; Schema: -; Owner: pg_database_owner
--

CREATE SCHEMA public;


ALTER SCHEMA public OWNER TO pg_database_owner;

--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: pg_database_owner
--

COMMENT ON SCHEMA public IS 'standard public schema';


--
-- Name: handle_new_user(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.handle_new_user() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
declare
  created_by_admin boolean := coalesce((new.raw_user_meta_data->>'created_by_admin')::boolean, false);
begin
  insert into public.profiles (id, name, email, phone, status)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', new.email),
    new.email,
    new.raw_user_meta_data->>'phone',
    case when created_by_admin then 'active' else 'pending' end
  );
  return new;
end;
$$;


ALTER FUNCTION public.handle_new_user() OWNER TO postgres;

--
-- Name: is_active(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.is_active() RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  select exists (
    select 1 from public.profiles where id = auth.uid() and status = 'active'
  );
$$;


ALTER FUNCTION public.is_active() OWNER TO postgres;

--
-- Name: is_admin(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.is_admin() RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  select exists (
    select 1 from public.profiles where id = auth.uid() and system_role = 'admin'
  );
$$;


ALTER FUNCTION public.is_admin() OWNER TO postgres;

--
-- Name: is_manager(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.is_manager() RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and system_role in ('admin', 'dept_manager')
  );
$$;


ALTER FUNCTION public.is_manager() OWNER TO postgres;

--
-- Name: is_worship_member(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.is_worship_member() RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  select public.is_admin() or exists (
    select 1 from public.department_members dm
    join public.departments d on d.id = dm.department_id
    join public.profiles p on p.id = dm.user_id
    where dm.user_id = auth.uid() and d.is_worship = true and p.status = 'active'
  );
$$;


ALTER FUNCTION public.is_worship_member() OWNER TO postgres;

--
-- Name: protect_privileged_profile_fields(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.protect_privileged_profile_fields() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
begin
  if not public.is_admin() then
    if new.system_role is distinct from old.system_role then
      raise exception 'Seul un administrateur peut modifier le rôle système.';
    end if;
    if new.status is distinct from old.status then
      raise exception 'Seul un administrateur peut modifier le statut du compte.';
    end if;
  end if;
  return new;
end;
$$;


ALTER FUNCTION public.protect_privileged_profile_fields() OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: department_members; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.department_members (
    department_id uuid NOT NULL,
    user_id uuid NOT NULL
);


ALTER TABLE public.department_members OWNER TO postgres;

--
-- Name: department_roles; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.department_roles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    department_id uuid NOT NULL,
    title text NOT NULL,
    person_id uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.department_roles OWNER TO postgres;

--
-- Name: departments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.departments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    color text DEFAULT 'accent'::text NOT NULL,
    is_worship boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.departments OWNER TO postgres;

--
-- Name: event_assignments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.event_assignments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    event_id uuid NOT NULL,
    user_id uuid NOT NULL,
    status text DEFAULT 'invited'::text NOT NULL,
    role_id uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT event_assignments_status_check CHECK ((status = ANY (ARRAY['invited'::text, 'accepted'::text, 'declined'::text, 'proposed'::text])))
);


ALTER TABLE public.event_assignments OWNER TO postgres;

--
-- Name: events; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.events (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    title text NOT NULL,
    date date NOT NULL,
    department_id uuid NOT NULL,
    recur_group uuid,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.events OWNER TO postgres;

--
-- Name: profiles; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.profiles (
    id uuid NOT NULL,
    name text NOT NULL,
    email text NOT NULL,
    system_role text DEFAULT 'member'::text NOT NULL,
    reminders_enabled boolean DEFAULT true NOT NULL,
    default_department_id uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    phone text,
    CONSTRAINT profiles_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'active'::text, 'rejected'::text]))),
    CONSTRAINT profiles_system_role_check CHECK ((system_role = ANY (ARRAY['admin'::text, 'dept_manager'::text, 'member'::text])))
);


ALTER TABLE public.profiles OWNER TO postgres;

--
-- Name: setlist_items; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.setlist_items (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    setlist_id uuid NOT NULL,
    song_id uuid NOT NULL,
    "position" integer NOT NULL,
    song_key text NOT NULL
);


ALTER TABLE public.setlist_items OWNER TO postgres;

--
-- Name: setlists; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.setlists (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    event_id uuid,
    lead_id uuid,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.setlists OWNER TO postgres;

--
-- Name: songs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.songs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    title text NOT NULL,
    song_key text,
    portail_ref integer,
    reference_url text,
    lyrics text,
    chords text,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.songs OWNER TO postgres;

--
-- Name: unavailability; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.unavailability (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    start_date date NOT NULL,
    end_date date NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT unavailability_check CHECK ((end_date >= start_date))
);


ALTER TABLE public.unavailability OWNER TO postgres;

--
-- Name: department_members department_members_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.department_members
    ADD CONSTRAINT department_members_pkey PRIMARY KEY (department_id, user_id);


--
-- Name: department_roles department_roles_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.department_roles
    ADD CONSTRAINT department_roles_pkey PRIMARY KEY (id);


--
-- Name: departments departments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.departments
    ADD CONSTRAINT departments_pkey PRIMARY KEY (id);


--
-- Name: event_assignments event_assignments_event_id_user_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.event_assignments
    ADD CONSTRAINT event_assignments_event_id_user_id_key UNIQUE (event_id, user_id);


--
-- Name: event_assignments event_assignments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.event_assignments
    ADD CONSTRAINT event_assignments_pkey PRIMARY KEY (id);


--
-- Name: events events_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.events
    ADD CONSTRAINT events_pkey PRIMARY KEY (id);


--
-- Name: profiles profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_pkey PRIMARY KEY (id);


--
-- Name: setlist_items setlist_items_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.setlist_items
    ADD CONSTRAINT setlist_items_pkey PRIMARY KEY (id);


--
-- Name: setlist_items setlist_items_setlist_id_position_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.setlist_items
    ADD CONSTRAINT setlist_items_setlist_id_position_key UNIQUE (setlist_id, "position");


--
-- Name: setlists setlists_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.setlists
    ADD CONSTRAINT setlists_pkey PRIMARY KEY (id);


--
-- Name: songs songs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.songs
    ADD CONSTRAINT songs_pkey PRIMARY KEY (id);


--
-- Name: unavailability unavailability_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.unavailability
    ADD CONSTRAINT unavailability_pkey PRIMARY KEY (id);


--
-- Name: profiles protect_profiles_privileged_fields; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER protect_profiles_privileged_fields BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.protect_privileged_profile_fields();


--
-- Name: department_members department_members_department_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.department_members
    ADD CONSTRAINT department_members_department_id_fkey FOREIGN KEY (department_id) REFERENCES public.departments(id) ON DELETE CASCADE;


--
-- Name: department_members department_members_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.department_members
    ADD CONSTRAINT department_members_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: department_roles department_roles_department_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.department_roles
    ADD CONSTRAINT department_roles_department_id_fkey FOREIGN KEY (department_id) REFERENCES public.departments(id) ON DELETE CASCADE;


--
-- Name: department_roles department_roles_person_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.department_roles
    ADD CONSTRAINT department_roles_person_id_fkey FOREIGN KEY (person_id) REFERENCES public.profiles(id) ON DELETE SET NULL;


--
-- Name: event_assignments event_assignments_event_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.event_assignments
    ADD CONSTRAINT event_assignments_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.events(id) ON DELETE CASCADE;


--
-- Name: event_assignments event_assignments_role_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.event_assignments
    ADD CONSTRAINT event_assignments_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.department_roles(id) ON DELETE SET NULL;


--
-- Name: event_assignments event_assignments_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.event_assignments
    ADD CONSTRAINT event_assignments_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: events events_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.events
    ADD CONSTRAINT events_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.profiles(id) ON DELETE SET NULL;


--
-- Name: events events_department_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.events
    ADD CONSTRAINT events_department_id_fkey FOREIGN KEY (department_id) REFERENCES public.departments(id) ON DELETE CASCADE;


--
-- Name: profiles profiles_default_department_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_default_department_fkey FOREIGN KEY (default_department_id) REFERENCES public.departments(id) ON DELETE SET NULL;


--
-- Name: profiles profiles_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: setlist_items setlist_items_setlist_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.setlist_items
    ADD CONSTRAINT setlist_items_setlist_id_fkey FOREIGN KEY (setlist_id) REFERENCES public.setlists(id) ON DELETE CASCADE;


--
-- Name: setlist_items setlist_items_song_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.setlist_items
    ADD CONSTRAINT setlist_items_song_id_fkey FOREIGN KEY (song_id) REFERENCES public.songs(id) ON DELETE RESTRICT;


--
-- Name: setlists setlists_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.setlists
    ADD CONSTRAINT setlists_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.profiles(id) ON DELETE SET NULL;


--
-- Name: setlists setlists_event_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.setlists
    ADD CONSTRAINT setlists_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.events(id) ON DELETE SET NULL;


--
-- Name: setlists setlists_lead_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.setlists
    ADD CONSTRAINT setlists_lead_id_fkey FOREIGN KEY (lead_id) REFERENCES public.profiles(id) ON DELETE SET NULL;


--
-- Name: songs songs_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.songs
    ADD CONSTRAINT songs_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.profiles(id) ON DELETE SET NULL;


--
-- Name: unavailability unavailability_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.unavailability
    ADD CONSTRAINT unavailability_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: department_members; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.department_members ENABLE ROW LEVEL SECURITY;

--
-- Name: department_members department_members: gestion réservée à l'admin; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "department_members: gestion réservée à l'admin" ON public.department_members TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());


--
-- Name: department_members department_members: lecture selon statut; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "department_members: lecture selon statut" ON public.department_members FOR SELECT TO authenticated USING ((public.is_admin() OR public.is_active()));


--
-- Name: department_roles; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.department_roles ENABLE ROW LEVEL SECURITY;

--
-- Name: department_roles department_roles: gestion réservée à l'admin; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "department_roles: gestion réservée à l'admin" ON public.department_roles TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());


--
-- Name: department_roles department_roles: lecture selon statut; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "department_roles: lecture selon statut" ON public.department_roles FOR SELECT TO authenticated USING ((public.is_admin() OR public.is_active()));


--
-- Name: departments; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;

--
-- Name: departments departments: gestion réservée à l'admin; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "departments: gestion réservée à l'admin" ON public.departments TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());


--
-- Name: departments departments: lecture selon statut; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "departments: lecture selon statut" ON public.departments FOR SELECT TO authenticated USING ((public.is_admin() OR public.is_active()));


--
-- Name: event_assignments; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.event_assignments ENABLE ROW LEVEL SECURITY;

--
-- Name: event_assignments event_assignments: invitation par un responsable, ou se propose; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "event_assignments: invitation par un responsable, ou se propose" ON public.event_assignments FOR INSERT TO authenticated WITH CHECK ((public.is_manager() OR ((user_id = auth.uid()) AND (status = 'proposed'::text))));


--
-- Name: event_assignments event_assignments: lecture selon statut; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "event_assignments: lecture selon statut" ON public.event_assignments FOR SELECT TO authenticated USING ((public.is_admin() OR public.is_active()));


--
-- Name: event_assignments event_assignments: répondre à sa propre invitation, ou gestio; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "event_assignments: répondre à sa propre invitation, ou gestio" ON public.event_assignments FOR UPDATE TO authenticated USING (((user_id = auth.uid()) OR public.is_manager())) WITH CHECK (((user_id = auth.uid()) OR public.is_manager()));


--
-- Name: event_assignments event_assignments: suppression réservée à un responsable; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "event_assignments: suppression réservée à un responsable" ON public.event_assignments FOR DELETE TO authenticated USING (public.is_manager());


--
-- Name: events; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

--
-- Name: events events: création/modification par admin ou responsable; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "events: création/modification par admin ou responsable" ON public.events TO authenticated USING (public.is_manager()) WITH CHECK (public.is_manager());


--
-- Name: events events: lecture selon statut; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "events: lecture selon statut" ON public.events FOR SELECT TO authenticated USING ((public.is_admin() OR public.is_active()));


--
-- Name: profiles; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

--
-- Name: profiles profiles: admin peut tout modifier; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "profiles: admin peut tout modifier" ON public.profiles FOR INSERT TO authenticated WITH CHECK (public.is_admin());


--
-- Name: profiles profiles: lecture selon statut; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "profiles: lecture selon statut" ON public.profiles FOR SELECT TO authenticated USING (((id = auth.uid()) OR public.is_admin() OR public.is_active()));


--
-- Name: profiles profiles: modification de son propre profil; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "profiles: modification de son propre profil" ON public.profiles FOR UPDATE TO authenticated USING (((id = auth.uid()) OR public.is_admin()));


--
-- Name: setlist_items; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.setlist_items ENABLE ROW LEVEL SECURITY;

--
-- Name: setlist_items setlist_items: gestion par tout membre de l'équipe Louange; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "setlist_items: gestion par tout membre de l'équipe Louange" ON public.setlist_items TO authenticated USING (public.is_worship_member()) WITH CHECK (public.is_worship_member());


--
-- Name: setlist_items setlist_items: lecture réservée à l'équipe Louange; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "setlist_items: lecture réservée à l'équipe Louange" ON public.setlist_items FOR SELECT TO authenticated USING (public.is_worship_member());


--
-- Name: setlists; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.setlists ENABLE ROW LEVEL SECURITY;

--
-- Name: setlists setlists: gestion par tout membre de l'équipe Louange; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "setlists: gestion par tout membre de l'équipe Louange" ON public.setlists TO authenticated USING (public.is_worship_member()) WITH CHECK (public.is_worship_member());


--
-- Name: setlists setlists: lecture réservée à l'équipe Louange; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "setlists: lecture réservée à l'équipe Louange" ON public.setlists FOR SELECT TO authenticated USING (public.is_worship_member());


--
-- Name: songs; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.songs ENABLE ROW LEVEL SECURITY;

--
-- Name: songs songs: ajout par tout membre de l'équipe Louange; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "songs: ajout par tout membre de l'équipe Louange" ON public.songs FOR INSERT TO authenticated WITH CHECK (public.is_worship_member());


--
-- Name: songs songs: lecture réservée à l'équipe Louange; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "songs: lecture réservée à l'équipe Louange" ON public.songs FOR SELECT TO authenticated USING (public.is_worship_member());


--
-- Name: songs songs: modification réservée à l'admin; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "songs: modification réservée à l'admin" ON public.songs FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());


--
-- Name: songs songs: suppression réservée à l'admin; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "songs: suppression réservée à l'admin" ON public.songs FOR DELETE TO authenticated USING (public.is_admin());


--
-- Name: unavailability; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.unavailability ENABLE ROW LEVEL SECURITY;

--
-- Name: unavailability unavailability: chacun gère les siennes; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "unavailability: chacun gère les siennes" ON public.unavailability TO authenticated USING (((user_id = auth.uid()) OR public.is_admin())) WITH CHECK (((user_id = auth.uid()) OR public.is_admin()));


--
-- Name: unavailability unavailability: visible selon statut; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "unavailability: visible selon statut" ON public.unavailability FOR SELECT TO authenticated USING ((public.is_admin() OR public.is_active()));


--
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: pg_database_owner
--

GRANT USAGE ON SCHEMA public TO postgres;
GRANT USAGE ON SCHEMA public TO anon;
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO service_role;


--
-- Name: FUNCTION handle_new_user(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.handle_new_user() TO anon;
GRANT ALL ON FUNCTION public.handle_new_user() TO authenticated;
GRANT ALL ON FUNCTION public.handle_new_user() TO service_role;


--
-- Name: FUNCTION is_active(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.is_active() TO anon;
GRANT ALL ON FUNCTION public.is_active() TO authenticated;
GRANT ALL ON FUNCTION public.is_active() TO service_role;


--
-- Name: FUNCTION is_admin(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.is_admin() TO anon;
GRANT ALL ON FUNCTION public.is_admin() TO authenticated;
GRANT ALL ON FUNCTION public.is_admin() TO service_role;


--
-- Name: FUNCTION is_manager(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.is_manager() TO anon;
GRANT ALL ON FUNCTION public.is_manager() TO authenticated;
GRANT ALL ON FUNCTION public.is_manager() TO service_role;


--
-- Name: FUNCTION is_worship_member(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.is_worship_member() TO anon;
GRANT ALL ON FUNCTION public.is_worship_member() TO authenticated;
GRANT ALL ON FUNCTION public.is_worship_member() TO service_role;


--
-- Name: FUNCTION protect_privileged_profile_fields(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.protect_privileged_profile_fields() TO anon;
GRANT ALL ON FUNCTION public.protect_privileged_profile_fields() TO authenticated;
GRANT ALL ON FUNCTION public.protect_privileged_profile_fields() TO service_role;


--
-- Name: TABLE department_members; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.department_members TO anon;
GRANT ALL ON TABLE public.department_members TO authenticated;
GRANT ALL ON TABLE public.department_members TO service_role;


--
-- Name: TABLE department_roles; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.department_roles TO anon;
GRANT ALL ON TABLE public.department_roles TO authenticated;
GRANT ALL ON TABLE public.department_roles TO service_role;


--
-- Name: TABLE departments; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.departments TO anon;
GRANT ALL ON TABLE public.departments TO authenticated;
GRANT ALL ON TABLE public.departments TO service_role;


--
-- Name: TABLE event_assignments; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.event_assignments TO anon;
GRANT ALL ON TABLE public.event_assignments TO authenticated;
GRANT ALL ON TABLE public.event_assignments TO service_role;


--
-- Name: TABLE events; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.events TO anon;
GRANT ALL ON TABLE public.events TO authenticated;
GRANT ALL ON TABLE public.events TO service_role;


--
-- Name: TABLE profiles; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.profiles TO anon;
GRANT ALL ON TABLE public.profiles TO authenticated;
GRANT ALL ON TABLE public.profiles TO service_role;


--
-- Name: TABLE setlist_items; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.setlist_items TO anon;
GRANT ALL ON TABLE public.setlist_items TO authenticated;
GRANT ALL ON TABLE public.setlist_items TO service_role;


--
-- Name: TABLE setlists; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.setlists TO anon;
GRANT ALL ON TABLE public.setlists TO authenticated;
GRANT ALL ON TABLE public.setlists TO service_role;


--
-- Name: TABLE songs; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.songs TO anon;
GRANT ALL ON TABLE public.songs TO authenticated;
GRANT ALL ON TABLE public.songs TO service_role;


--
-- Name: TABLE unavailability; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.unavailability TO anon;
GRANT ALL ON TABLE public.unavailability TO authenticated;
GRANT ALL ON TABLE public.unavailability TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: public; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON SEQUENCES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON SEQUENCES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON SEQUENCES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON SEQUENCES TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: public; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON SEQUENCES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON SEQUENCES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON SEQUENCES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON SEQUENCES TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: public; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON FUNCTIONS TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON FUNCTIONS TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON FUNCTIONS TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON FUNCTIONS TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: public; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON FUNCTIONS TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON FUNCTIONS TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON FUNCTIONS TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON FUNCTIONS TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: public; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON TABLES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON TABLES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON TABLES TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: public; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON TABLES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON TABLES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON TABLES TO service_role;


--
-- PostgreSQL database dump complete
--

\unrestrict hLglrcPOZyh9g7Yw9dyb8x29s6d6bNLjki9Su3z02yIZu8Si9QQ7Pzewbs1whKa

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
