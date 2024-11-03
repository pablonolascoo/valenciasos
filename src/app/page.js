// ruta: src/app/page.js
"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import styled from "styled-components";
import Image from "next/image";

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
    fetchData();
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
      fetchData();
      setTimeout(() => {
        setClickedAssistance((prev) => ({ ...prev, [id]: false }));
      }, DISABLED_TIME);
    } catch (error) {
      console.error("Error updating asistencia:", error);
    }
  };

  const handleInputChange = async (e) => {
    const { name, value } = e.target;
    setNewHelp((prev) => ({ ...prev, [name]: value }));

    if (name === "nombre" && value) {
      try {
        const response = await axios.get(`/api/ayudas/search?nombre=${value}`);
        setDuplicados(response.data.data);
        setIsDuplicate(response.data.data.length > 0);
      } catch (error) {
        console.error("Error fetching duplicates:", error);
      }
    }

    if (
      (name === "localidad" && value !== initialValues.localidad) ||
      (name === "descripcion" && value !== initialValues.descripcion)
    ) {
      setIsDuplicate(false);
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
      fetchData();
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
    console.log("ID enviado para incrementar solicitud:", help._id);
    try {
      await axios.patch("/api/ayudas", { id: help._id });
      setMessage("Solicitud incrementada con éxito.");
      fetchData();

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

  return (
    <Container>
      <StickySection>
        <SectionHeader>
          <Title>Más recientes</Title>
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
              <HelpLocation>{ayuda.localidad}</HelpLocation>
              <p>{ayuda.descripcion}</p>
              <Stats>
                <span>Solicitudes: {ayuda.totalSolicitudes}</span>
                <span>Asistencias: {ayuda.totalAsistencias}</span>
              </Stats>
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
            </AyudaCard>
          ))}
        </Grid>
      </StickySection>

      <StickySection>
        <SectionHeader>
          <Title>Más solicitado</Title>
          <PaginationControls>
            <PaginationButton onClick={handlePreviousPagePopulares}>
              Anterior
            </PaginationButton>
            <PaginationButton onClick={handleNextPagePopulares}>
              Siguiente
            </PaginationButton>
          </PaginationControls>
        </SectionHeader>
        <Grid>
          {populares.map((ayuda) => (
            <AyudaCard key={ayuda._id}>
              <HelpTitle>{ayuda.nombre}</HelpTitle>
              <HelpLocation>{ayuda.localidad}</HelpLocation>
              <p>{ayuda.descripcion}</p>
              <Stats>
                <span>Solicitudes: {ayuda.totalSolicitudes}</span>
                <span>Asistencias: {ayuda.totalAsistencias}</span>
              </Stats>
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

            <Input
              type="text"
              name="localidad"
              placeholder="Localidad"
              value={newHelp.localidad || ""}
              onChange={handleInputChange}
            />
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
  padding: 10px;
  font-family: "Nunito Sans", "Montserrat", sans-serif;
`;

const StickySection = styled.div`
  position: relative;
  margin-bottom: 30px;
`;

const SectionHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: sticky;
  top: 0;
  gap: 10px;
  background-color: #fff;
  padding: 10px 0;
  z-index: 1;
`;

const Title = styled.div`
  font-size: 18px;
  font-weight: bold;
`;

const PaginationControls = styled.div`
  display: flex;
  gap: 10px;
`;

const PaginationButton = styled.button`
  padding: 5px 10px;
`;

const Button = styled.button`
  padding: 5px 10px;
`;

const SubmitButton = styled.button`
  font-size: 1rem;
  padding: 12px;
  border: none;
  border-radius: 6px;
  width: 100%;
  margin: 8px 0;
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
  gap: 10px;
`;

const AyudaCard = styled.div`
  padding: 10px;
  background-color: #f9f9f9;
  border-radius: 8px;
  position: relative;
`;

const HelpTitle = styled.h3`
  font-size: 1.2rem;
  margin: 0;
  padding: 0;
`;

const HelpLocation = styled.p`
  font-size: 0.9rem;
  color: #666;
  margin: 4px 0;
`;

const Stats = styled.div`
  display: flex;
  justify-content: space-between;
  font-size: 14px;
  color: #555;
`;

const Message = styled.p`
  color: #28a745;
  margin-top: 10px;
  font-size: 14px;
`;

const ActionButton = styled.button`
  width: 100%;
  background-color: ${({ active }) => (active ? "#98dbe3" : "#f0f0f0")};
  border-radius: 8px;
  margin-top: 12px;
  padding: 8px;
  border: none;
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: ${({ active }) => (active ? "pointer" : "not-allowed")};
  transition: background-color 0.3s ease;
`;

const ButtonText = styled.span`
  margin-left: 8px;
  font-size: 0.9rem;
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
  gap: 10px;
  background-color: #fff;
  padding: 20px;
  border-radius: 8px;
  width: 80%;
  max-width: 400px;
  text-align: center;
`;

const Input = styled.input`
  font-size: 1rem;
  padding: 12px;
  border: 1px solid #ccc;
  border-radius: 6px;
  width: 100%;
  margin: 8px 0;
  box-sizing: border-box;
`;

const DuplicateList = styled.div`
  margin-top: 10px;
  background: #f8f8f8;
  border-radius: 4px;
  padding: 10px;
`;

const DuplicateItem = styled.div`
  padding: 5px;
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
  border-radius: 10px;
  padding: 2px 4px;
  right: 10px;
  bottom: 20px;
  font-size: 0.8em;
  color: ${({ isExceeded }) => (isExceeded ? "red" : "gray")};
  pointer-events: none; // Evita que interfiera con el input
`;
