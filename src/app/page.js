// ruta: src/app/page.js
"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import styled from "styled-components";
import Image from "next/image";

import Sizes from '@/constants/Sizes';

export default function Home() {
  const [recientes, setRecientes] = useState([]);
  const [populares, setPopulares] = useState([]);
  const [newHelp, setNewHelp] = useState({
    _id: null,
    nombre: "",
    descripcion: "",
    localidad: "",
    location: { type: "Point", coordinates: [] },
  });
  const [duplicados, setDuplicados] = useState([]);
  const [clickedNecessity, setClickedNecessity] = useState({});
  const [clickedAssistance, setClickedAssistance] = useState({});
  const [currentPageRecientes, setCurrentPageRecientes] = useState(1);
  const [currentPagePopulares, setCurrentPagePopulares] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [message, setMessage] = useState(null);
  const [itemsPerPage] = useState(10);
  const DISABLED_TIME = 240000;
  const [isDuplicate, setIsDuplicate] = useState(false);
  const [initialValues, setInitialValues] = useState({
    localidad: "",
    descripcion: "",
  });

  const [localidades, setLocalidades] = useState([]);

  const fetchData = async (type, page) => {
    try {
      const response = await axios.get(
        `/api/ayudas?type=${type}&page=${page}&limit=${itemsPerPage}`
      );
      return response.data.data;
    } catch (error) {
      console.error(`Error fetching ${type} data:`, error);
      return [];
    }
  };

  const loadRecientes = async () => {
    const data = await fetchData("recientes", currentPageRecientes);
    setRecientes(data);
  };

  const loadPopulares = async () => {
    const data = await fetchData("populares", currentPagePopulares);
    setPopulares(data);
  };

  useEffect(() => {
    loadRecientes();
    loadPopulares();
  }, [currentPageRecientes, currentPagePopulares]);

  useEffect(() => {
    loadRecientes();
    loadPopulares();
    const intervalId = setInterval(fetchData, 20000);
    return () => clearInterval(intervalId);
  }, []);

  const handleNextPageRecientes = () =>
    setCurrentPageRecientes((prev) => prev + 1);
  const handlePreviousPageRecientes = () =>
    setCurrentPageRecientes((prev) => Math.max(prev - 1, 1));

  const handleNextPagePopulares = () =>
    setCurrentPagePopulares((prev) => prev + 1);
  const handlePreviousPagePopulares = () =>
    setCurrentPagePopulares((prev) => Math.max(prev - 1, 1));

  const handleAsistencia = async (id) => {
    if (clickedAssistance[id]) return;

    const confirmed = window.confirm(
      "¿Estás seguro de que deseas incrementar el contador de Asistencia en 1 para esta Ayuda?"
    );

    if (!confirmed) return;

    try {
      await axios.put("/api/ayudas", { id });
      setClickedAssistance((prev) => ({ ...prev, [id]: true }));
      loadRecientes();
      loadPopulares();
      setTimeout(() => {
        setClickedAssistance((prev) => ({ ...prev, [id]: false }));
      }, DISABLED_TIME);
    } catch (error) {
      console.error("Error updating asistencia:", error);
    }
  };

  const handleInputChange = async (e) => {
    const { name, value } = e.target;
    setNewHelp((prev) => ({
      ...prev,
      [name]: value,
      ...(name === "localidad" || name === "descripcion" ? { _id: null } : {}),
    }));

    if (
      (name === "localidad" && value !== initialValues.localidad) ||
      (name === "descripcion" && value !== initialValues.descripcion)
    ) {
      setIsDuplicate(false);
    }
  
    if (name === "nombre" && value) {
      try {
        const response = await axios.get(`/api/ayudas/search?nombre=${value}`);
        setDuplicados(response.data.data);
        setIsDuplicate(response.data.data.length > 0);
      } catch (error) {
        console.error("Error fetching duplicates:", error);
      }
    }
  
    if (name === "localidad" && value) {
      try {
        const response = await axios.get(`/api/localidades/search?localidad=${value}`);
        setLocalidades(response.data.data);
      } catch (error) {
        console.error("Error fetching localidades:", error);
      }
    }
  };

  const fetchUserLocation = async () => {
    try {
      const response = await axios.get("https://ipapi.co/json/");
      const { latitude, longitude } = response.data;
      setNewHelp((prev) => ({
        ...prev,
        location: {
          type: "Point",
          coordinates: [parseFloat(longitude), parseFloat(latitude)],
        },
      }));
    } catch (error) {
      console.error("Error fetching location:", error);
    }
  };

  useEffect(() => {
    if (isModalOpen) fetchUserLocation();
  }, [isModalOpen]);

  const handleAddNewHelp = async () => {
    try {
      const helpData = {
        ...newHelp,
        totalSolicitudes: 1,
      };

      delete helpData._id;

      await axios.post("/api/ayudas", helpData);
      loadRecientes();
      loadPopulares();
      setMessage("Solicitud enviada con éxito.");
      setIsDuplicate(false);
      setTimeout(() => {
        setNewHelp({
          _id: null,
          nombre: "",
          descripcion: "",
          localidad: "",
          location: { type: "Point", coordinates: [] },
        });
        setIsModalOpen(false);
        setMessage(null);
      }, 1000);
    } catch (error) {
      console.error("Error submitting new help:", error);

      if (error.response && error.response.data && error.response.data.error) {
        setMessage(error.response.data.error);
      } else {
        setMessage("Error al enviar la solicitud.");
      }
    }
  };

  const handleSolicitudes = async (help) => {
    try {
      await axios.patch("/api/ayudas", { id: help._id });
      setMessage("Solicitud incrementada con éxito.");
      loadRecientes();
      loadPopulares();
      setTimeout(() => {
        setNewHelp({
          _id: null,
          nombre: "",
          descripcion: "",
          localidad: "",
          location: { type: "Point", coordinates: [] },
        });
        setIsDuplicate(false);
        setIsModalOpen(false);
        setMessage(null);
      }, 1000);
    } catch (error) {
      console.error("Error incrementando solicitudes:", error);
      setMessage("Error al incrementar la solicitud.");
    }
  };

  const handleSelectDuplicate = (dup) => {
    setNewHelp(dup);
    setIsDuplicate(true);

    setInitialValues({
      localidad: dup.localidad,
      descripcion: dup.descripcion,
    });
  };

  const handleOutsideClick = (e) => {
    if (e.target.id === "modalBackground") {
      setIsModalOpen(false);
    }
  };

  const handleNecesidad = async (ayuda) => {
    const clickedNecessity = JSON.parse(localStorage.getItem("clickedNecessity")) || {};

    const id = ayuda._id;
  
    if (clickedNecessity[ayuda._id]) return;
  
    const confirmed = window.confirm(
      `¿Estás seguro de que deseas incrementar el contador de Solicitudes en 1 para "${ayuda.nombre}" en "${ayuda.localidad}"?`
    );
  
    if (!confirmed) return;
  
    try {
      await axios.patch("/api/ayudas", { id: ayuda._id });
      setMessage("Necesidad incrementada con éxito.");
  
      loadRecientes();
      loadPopulares();
  
      setClickedNecessity((prev) => {
        const updatedNecessity = { ...prev, [id]: true };
        localStorage.setItem("clickedNecessity", JSON.stringify(updatedNecessity));
        return updatedNecessity;
      });
  
      setTimeout(() => {
        setClickedNecessity((prev) => {
          const updatedNecessity = { ...prev, [id]: false };
          localStorage.setItem("clickedNecessity", JSON.stringify(updatedNecessity));
          return updatedNecessity;
        });
      }, DISABLED_TIME);
    } catch (error) {
      console.error("Error incrementando necesidad:", error);
      setMessage("Error al incrementar la necesidad.");
    }
  };
  
  // UseEffect para cargar estado de clickedAssistance y clickedNecessity desde localStorage al inicio
  useEffect(() => {
    const storedAssistance = JSON.parse(localStorage.getItem("clickedAssistance")) || {};
    const storedNecessity = JSON.parse(localStorage.getItem("clickedNecessity")) || {};
    setClickedAssistance(storedAssistance);
    setClickedNecessity(storedNecessity);
  }, []);  

  return (
    <Container>
      <StickySection>
        <SectionHeader>
          <Title variant="recientes">Más recientes</Title>
          <PaginationControls>
            <PaginationButton onClick={handlePreviousPageRecientes}>
              Anterior
            </PaginationButton>
            <PaginationButton onClick={handleNextPageRecientes}>
              Siguiente
            </PaginationButton>
          </PaginationControls>
          <Button onClick={() => setIsModalOpen(true)}>Solicitar Ayuda</Button>
        </SectionHeader>
        <Grid>
          {recientes.map((ayuda) => (
            <AyudaCard key={ayuda._id}>
              <HelpTitle>{ayuda.nombre}</HelpTitle>
              <LocationWrapper>
                <Image
                  src={"/marcador.svg"}
                  alt="Icon"
                  width={12}
                  height={12}
                />
                <HelpLocation>
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(ayuda.localidad)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {ayuda.localidad}
                  </a>
                </HelpLocation>
              </LocationWrapper>
              <p>{ayuda.descripcion}</p>
              <Stats>
                <span>Solicitudes: {ayuda.totalSolicitudes}</span>
                <span>Asistencias: {ayuda.totalAsistencias}</span>
              </Stats>
              <ButtonWrapper>
                <ActionButton
                  onClick={() => handleNecesidad(ayuda)}
                  active={!clickedNecessity[ayuda._id]}
                  style={{ backgroundColor: clickedNecessity[ayuda._id] ? "#f8b2b2" : "#ed8c85" }}
                >
                  <Image
                    src={
                      clickedNecessity[ayuda._id]
                        ? "/comenta-alt-check.svg"
                        : "/chaleco-voluntario.svg"
                    }
                    alt="Icon"
                    width={24}
                    height={24}
                  />
                  <ButtonText>
                    {clickedNecessity[ayuda._id] ? "Necesidad Recibida" : "Lo Necesito"}
                  </ButtonText>
                </ActionButton>
                <ActionButton
                  onClick={() => handleAsistencia(ayuda._id)}
                  active={!clickedAssistance[ayuda._id]}
                >
                  <Image
                    src={
                      clickedAssistance[ayuda._id]
                        ? "/comenta-alt-check.svg"
                        : "/viaje-en-coche.svg"
                    }
                    alt="Icon"
                    width={24}
                    height={24}
                  />
                  <ButtonText>
                    {clickedAssistance[ayuda._id] ? "Recibido" : "Voy en camino"}
                  </ButtonText>
                </ActionButton>
              </ButtonWrapper>
            </AyudaCard>
          ))}
        </Grid>
      </StickySection>

      <StickySection>
        <SectionHeader>
          <Title variant="solicitado">Más solicitado</Title>
          <PaginationControls>
            <PaginationButton onClick={handlePreviousPagePopulares}>
              Anterior
            </PaginationButton>
            <PaginationButton onClick={handleNextPagePopulares}>
              Siguiente
            </PaginationButton>
          </PaginationControls>
          <Button onClick={() => setIsModalOpen(true)}>Solicitar Ayuda</Button>
        </SectionHeader>
        <Grid>
          {populares.map((ayuda) => (
            <AyudaCard key={ayuda._id}>
              <HelpTitle>{ayuda.nombre}</HelpTitle>
              <LocationWrapper>
                <Image
                  src={"/marcador.svg"}
                  alt="Icon"
                  width={12}
                  height={12}
                />
                <HelpLocation>
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(ayuda.localidad)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {ayuda.localidad}
                  </a>
                </HelpLocation>
              </LocationWrapper>
              <p>{ayuda.descripcion}</p>
              <Stats>
                <span>Solicitudes: {ayuda.totalSolicitudes}</span>
                <span>Asistencias: {ayuda.totalAsistencias}</span>
              </Stats>
              <ButtonWrapper>
                <ActionButton
                  onClick={() => handleNecesidad(ayuda)}
                  active={!clickedNecessity[ayuda._id]}
                  style={{ backgroundColor: clickedNecessity[ayuda._id] ? "#f8b2b2" : "#ed8c85" }}
                >
                  <Image
                    src={
                      clickedNecessity[ayuda._id]
                        ? "/comenta-alt-check.svg"
                        : "/chaleco-voluntario.svg"
                    }
                    alt="Icon"
                    width={24}
                    height={24}
                  />
                  <ButtonText>
                    {clickedNecessity[ayuda._id] ? "Necesidad Recibida" : "Lo Necesito"}
                  </ButtonText>
                </ActionButton>
                <ActionButton
                  onClick={() => handleAsistencia(ayuda._id)}
                  active={!clickedAssistance[ayuda._id]}
                >
                  <Image
                    src={
                      clickedAssistance[ayuda._id]
                        ? "/comenta-alt-check.svg"
                        : "/viaje-en-coche.svg"
                    }
                    alt="Icon"
                    width={24}
                    height={24}
                  />
                  <ButtonText>
                    {clickedAssistance[ayuda._id] ? "Asistencia Recibida" : "Voy en camino"}
                  </ButtonText>
                </ActionButton>
              </ButtonWrapper>
            </AyudaCard>
          ))}
        </Grid>
      </StickySection>
      {isModalOpen && (
        <ModalBackground id="modalBackground" onClick={handleOutsideClick}>
          <ModalContent>
            <h3>Solicitar Ayuda</h3>

            <InputWrapper>
              <Input
                type="text"
                name="nombre"
                placeholder="Nombre de la ayuda"
                value={newHelp.nombre || ""}
                onChange={handleInputChange}
              />
              <CharacterCount isExceeded={newHelp.nombre.length > 30}>
                {newHelp.nombre.length}/30
              </CharacterCount>
            </InputWrapper>

            {duplicados.length > 0 && (
              <DuplicateList>
                {duplicados.map((dup) => (
                  <DuplicateItem
                    key={dup._id}
                    onClick={() => handleSelectDuplicate(dup)}
                  >
                    {dup.nombre} - {dup.localidad}
                  </DuplicateItem>
                ))}
              </DuplicateList>
            )}

            <InputWrapper>
              <Input
                type="text"
                name="descripcion"
                placeholder="Descripción"
                value={newHelp.descripcion || ""}
                onChange={handleInputChange}
              />
              <CharacterCount isExceeded={newHelp.descripcion.length > 100}>
                {newHelp.descripcion.length}/100
              </CharacterCount>
            </InputWrapper>

            <InputWrapper>
              <Input
                type="text"
                name="localidad"
                placeholder="Localidad (pueblo, ciudad o pedanía)"
                value={newHelp.localidad || ""}
                onChange={handleInputChange}
              />
              <CharacterCount isExceeded={newHelp.localidad.length > 30}>
                {newHelp.localidad.length}/30
              </CharacterCount>
            </InputWrapper>

            {localidades.length > 0 && (
              <DuplicateList>
                {localidades.map((loc) => (
                  <DuplicateItem
                    key={loc._id}
                    onClick={() => setNewHelp((prev) => ({ ...prev, localidad: loc.nombre }))}
                  >
                    {loc.nombre}
                  </DuplicateItem>
                ))}
              </DuplicateList>
            )}
            <p>Coordenadas: {newHelp.coordenadas || "Cargando ubicación..."}</p>

            <SubmitButton
              isDuplicate={isDuplicate}
              onClick={
                isDuplicate
                  ? () => handleSolicitudes(newHelp)
                  : handleAddNewHelp
              }
            >
              {isDuplicate ? "Solicitar Ayuda" : "Enviar"}
            </SubmitButton>
            {message && <Message>{message}</Message>}
          </ModalContent>
        </ModalBackground>
      )}
    </Container>
  );
}

const Container = styled.div`
  padding: ${Sizes.spacing.md};
  font-family: "Nunito Sans", "Montserrat", sans-serif;
`;

const StickySection = styled.div`
  position: relative;
  margin-bottom: ${Sizes.spacing.lg};
`;

const SectionHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: sticky;
  top: 0;
  gap: ${Sizes.spacing.sm};
  border-radius: 0px 0px ${Sizes.borderRad.md} ${Sizes.borderRad.md};
  background-color: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  padding: ${Sizes.spacing.sm};
  z-index: 1;
  box-shadow: ${Sizes.shadows.light};
`;

const Title = styled.h2`
  font-size: ${Sizes.fontSizes.lg};
  font-weight: bold;
  color: ${({ variant }) => (variant === "recientes" ? "#1E90FF" : "#FF4500")};
`;

const PaginationControls = styled.div`
  display: flex;
  gap: ${Sizes.spacing.sm};
`;

const PaginationButton = styled.button`
  padding: ${Sizes.spacing.xs} ${Sizes.spacing.sm};
`;

const Button = styled.button`
  padding: ${Sizes.spacing.xs} ${Sizes.spacing.sm};
`;

const SubmitButton = styled.button`
  font-size: ${Sizes.fontSizes.md};
  padding: ${Sizes.spacing.md};
  border: none;
  border-radius: ${Sizes.borderRad.md};
  width: 100%;
  margin: ${Sizes.spacing.sm} 0;
  box-sizing: border-box;
  background-color: ${({ isDuplicate }) =>
    isDuplicate ? "#4caf50" : "#2196f3"};
  color: #fff;
  cursor: pointer;
  transition: background-color 0.3s ease;

  &:hover {
    background-color: ${({ isDuplicate }) =>
      isDuplicate ? "#45a049" : "#1976d2"};
  }
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: ${Sizes.spacing.sm};
  padding: ${Sizes.spacing.sm};
`;

import Sizes from '../constants/Sizes';

const AyudaCard = styled.div`
  padding: ${Sizes.spacing.sm};
  background-color: #f9f9f9;
  border-radius: ${Sizes.borderRad.md};
  position: relative;
`;

const HelpTitle = styled.h3`
  font-size: ${Sizes.fontSizes.lg};
  margin: 0;
  padding: 0;
`;

const HelpLocation = styled.p`
  font-size: ${Sizes.fontSizes.sm};
  color: #666;
  margin: ${Sizes.spacing.xs} 0;
`;

const Stats = styled.div`
  display: flex;
  justify-content: space-between;
  font-size: ${Sizes.fontSizes.sm};
  color: #555;
`;

const Message = styled.p`
  color: #28a745;
  margin-top: ${Sizes.spacing.sm};
  font-size: ${Sizes.fontSizes.sm};
`;

const LocationWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: ${Sizes.spacing.xs};
  width: 100%;
`;

const ButtonWrapper = styled.div`
  display: flex;
  gap: ${Sizes.spacing.sm};
  width: 100%;
`;

const ActionButton = styled.button`
  width: 100%;
  background-color: ${({ active }) => (active ? "#98dbe3" : "#f0f0f0")};
  border-radius: ${Sizes.borderRad.md};
  margin-top: ${Sizes.spacing.md};
  padding: ${Sizes.spacing.sm};
  border: none;
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: ${({ active }) => (active ? "pointer" : "not-allowed")};
  transition: background-color 0.3s ease;
`;

const ButtonText = styled.span`
  margin-left: ${Sizes.spacing.xs};
  font-size: ${Sizes.fontSizes.sm};
  color: #333;
`;

const ModalBackground = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 100;
`;

const ModalContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${Sizes.spacing.sm};
  background-color: #fff;
  padding: ${Sizes.spacing.lg};
  border-radius: ${Sizes.borderRad.md};
  width: 80%;
  max-width: 400px;
  max-height: 90vh;
  overflow-y: scroll;
  text-align: center;
`;

const Input = styled.input`
  font-size: ${Sizes.fontSizes.md};
  padding: ${Sizes.spacing.md};
  border: 1px solid #ccc;
  border-radius: ${Sizes.borderRad.md};
  width: 100%;
  margin: ${Sizes.spacing.sm} 0;
  box-sizing: border-box;
`;

const DuplicateList = styled.div`
  margin-top: ${Sizes.spacing.sm};
  background: #f8f8f8;
  border-radius: ${Sizes.borderRad.sm};
  padding: ${Sizes.spacing.sm};
`;

const DuplicateItem = styled.div`
  padding: ${Sizes.spacing.xs};
  cursor: pointer;
  &:hover {
    background-color: #e0e0e0;
  }
`;

const InputWrapper = styled.div`
  position: relative;
  width: 100%;
`;

const CharacterCount = styled.span`
  position: absolute;
  background-color: #fff;
  border: 0.5px solid #bbb;
  border-radius: ${Sizes.borderRad.sm};
  padding: 2px 4px;
  right: ${Sizes.spacing.sm};
  bottom: ${Sizes.spacing.lg};
  font-size: 0.8em;
  color: ${({ isExceeded }) => (isExceeded ? "red" : "gray")};
  pointer-events: none;
`;