import { BusesSection } from "@/components/cadastros/buses-section";
import { catalogSections } from "@/components/cadastros/config";
import { CatalogNavItem, PlaceholderSection } from "@/components/cadastros/ui";
import type { CatalogSectionKey } from "@/components/cadastros/types";
import { useAuth } from "@/contexts/auth-context";
import { canManageCompany, extractSessionRoles } from "@/services/auth";
import {
  createBus,
  deleteBuses,
  fetchBuses,
  getApiErrorMessage,
  updateBus,
  type Bus,
} from "@/services/buses";
import { Cpu, GraduationCap } from "lucide";
import { useEffect, useState } from "react";
import { Alert, ScrollView, Text, View, useWindowDimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const PAGE_SIZE = 5;
const MERCOSUL_PLATE_PATTERN = /^[A-Z]{3}[0-9][A-Z][0-9]{2}$/;

type BusFormErrors = {
  capacity?: string;
  general?: string;
  plate?: string;
};

function sanitizePlate(value: string) {
  return value.toUpperCase().replace(/[^A-Z0-9]/g, "");
}

async function requestBusPage(page: number, search: string) {
  return fetchBuses({
    page,
    limit: PAGE_SIZE,
    search: search || undefined,
  });
}

export default function CompanyScreen() {
  const { session } = useAuth();
  const { width } = useWindowDimensions();
  const canViewCompanyAdmin = canManageCompany(session);
  const sessionRoles = extractSessionRoles(session);
  const isCompactRail = width < 900;

  const [activeSection, setActiveSection] = useState<CatalogSectionKey>("buses");
  const [buses, setBuses] = useState<Bus[]>([]);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [totalBuses, setTotalBuses] = useState(0);
  const [searchInput, setSearchInput] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [plateInput, setPlateInput] = useState("");
  const [capacityInput, setCapacityInput] = useState("");
  const [isBusModalOpen, setIsBusModalOpen] = useState(false);
  const [editingBusId, setEditingBusId] = useState<string | null>(null);
  const [deletingBusId, setDeletingBusId] = useState<string | null>(null);
  const [isLoadingBuses, setIsLoadingBuses] = useState(false);
  const [isSavingBus, setIsSavingBus] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const [feedbackTone, setFeedbackTone] = useState<"error" | "success" | null>(null);
  const [busFormErrors, setBusFormErrors] = useState<BusFormErrors>({});

  const visibleCapacity = buses.reduce((total, bus) => total + bus.capacity, 0);

  function clearFeedback() {
    setFeedbackMessage(null);
    setFeedbackTone(null);
  }

  function clearBusFormErrors() {
    setBusFormErrors({});
  }

  function resetForm() {
    setEditingBusId(null);
    setPlateInput("");
    setCapacityInput("");
    clearBusFormErrors();
  }

  function closeBusModal() {
    if (isSavingBus) {
      return;
    }

    setIsBusModalOpen(false);
    resetForm();
  }

  function openCreateBusModal() {
    clearFeedback();
    resetForm();
    setIsBusModalOpen(true);
  }

  function validateBusForm() {
    const nextErrors: BusFormErrors = {};
    const plate = sanitizePlate(plateInput).trim();
    const capacity = Number.parseInt(capacityInput, 10);

    if (!plate) {
      nextErrors.plate = "Preencha a placa do onibus.";
    } else if (!MERCOSUL_PLATE_PATTERN.test(plate)) {
      nextErrors.plate = "Use o formato Mercosul, por exemplo: ABC1D23.";
    }

    if (!capacityInput.trim()) {
      nextErrors.capacity = "Preencha a capacidade.";
    } else if (!Number.isFinite(capacity) || capacity <= 0) {
      nextErrors.capacity = "Informe um numero inteiro maior que zero.";
    }

    return {
      capacity,
      isValid: Object.keys(nextErrors).length === 0,
      nextErrors,
      plate,
    };
  }

  function selectSection(nextSection: CatalogSectionKey) {
    if (isSavingBus) {
      return;
    }

    clearFeedback();
    closeBusModal();
    setActiveSection(nextSection);
  }

  async function loadBuses(nextPage = page, nextSearch = appliedSearch) {
    setIsLoadingBuses(true);

    try {
      const response = await requestBusPage(nextPage, nextSearch);
      setBuses(response.data);
      setTotalBuses(response.total);
      setLastPage(Math.max(response.lastPage, 1));
    } catch (error) {
      setFeedbackTone("error");
      setFeedbackMessage(
        getApiErrorMessage(error, "Nao foi possivel carregar os onibus."),
      );
    } finally {
      setIsLoadingBuses(false);
    }
  }

  useEffect(() => {
    if (!canViewCompanyAdmin || activeSection !== "buses") {
      return;
    }

    let isMounted = true;
    setIsLoadingBuses(true);

    void requestBusPage(page, appliedSearch)
      .then((response) => {
        if (!isMounted) {
          return;
        }

        setBuses(response.data);
        setTotalBuses(response.total);
        setLastPage(Math.max(response.lastPage, 1));
      })
      .catch((error: unknown) => {
        if (!isMounted) {
          return;
        }

        setFeedbackTone("error");
        setFeedbackMessage(
          getApiErrorMessage(error, "Nao foi possivel carregar os onibus."),
        );
      })
      .finally(() => {
        if (isMounted) {
          setIsLoadingBuses(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [activeSection, appliedSearch, canViewCompanyAdmin, page]);

  async function refreshOrMove(nextPage = page, nextSearch = appliedSearch) {
    if (page !== nextPage) {
      setPage(nextPage);
      return;
    }

    if (appliedSearch !== nextSearch) {
      setAppliedSearch(nextSearch);
      return;
    }

    await loadBuses(nextPage, nextSearch);
  }

  async function handleSubmitBus() {
    const { capacity, isValid, nextErrors, plate } = validateBusForm();

    if (!isValid) {
      setBusFormErrors(nextErrors);
      return;
    }

    setIsSavingBus(true);
    clearFeedback();
    clearBusFormErrors();

    try {
      if (editingBusId) {
        await updateBus(editingBusId, { capacity, plate });
        setFeedbackTone("success");
        setFeedbackMessage(`Onibus ${plate} atualizado com sucesso.`);
      } else {
        await createBus({ capacity, plate });
        setFeedbackTone("success");
        setFeedbackMessage(`Onibus ${plate} cadastrado com sucesso.`);
      }

      setIsBusModalOpen(false);
      resetForm();
      setSearchInput("");
      await refreshOrMove(1, "");
    } catch (error) {
      const message = getApiErrorMessage(error, "Nao foi possivel salvar o onibus.");
      const nextFormErrors: BusFormErrors = {
        general: message,
      };

      if (message.toLowerCase().includes("placa")) {
        nextFormErrors.plate = message;
      }

      setBusFormErrors(nextFormErrors);
    } finally {
      setIsSavingBus(false);
    }
  }

  async function handleDeleteBus(bus: Bus) {
    setDeletingBusId(bus.id);
    clearFeedback();

    try {
      await deleteBuses([bus.id]);
      setFeedbackTone("success");
      setFeedbackMessage(`Onibus ${bus.plate} excluido com sucesso.`);

      if (editingBusId === bus.id) {
        resetForm();
      }

      const nextPage = page > 1 && buses.length === 1 ? page - 1 : page;
      await refreshOrMove(nextPage, appliedSearch);
    } catch (error) {
      setFeedbackTone("error");
      setFeedbackMessage(
        getApiErrorMessage(error, "Nao foi possivel excluir o onibus."),
      );
    } finally {
      setDeletingBusId(null);
    }
  }

  function confirmDeleteBus(bus: Bus) {
    Alert.alert(
      "Excluir onibus",
      `Deseja excluir o onibus ${bus.plate}?`,
      [
        { style: "cancel", text: "Cancelar" },
        {
          style: "destructive",
          text: "Excluir",
          onPress: () => {
            void handleDeleteBus(bus);
          },
        },
      ],
    );
  }

  function startEditing(bus: Bus) {
    clearFeedback();
    clearBusFormErrors();
    setEditingBusId(bus.id);
    setPlateInput(bus.plate);
    setCapacityInput(String(bus.capacity));
    setIsBusModalOpen(true);
  }

  function renderActiveSection() {
    if (activeSection === "buses") {
      return (
        <BusesSection
          appliedSearch={appliedSearch}
          buses={buses}
          capacityInput={capacityInput}
          deletingBusId={deletingBusId}
          editingBusId={editingBusId}
          feedbackMessage={feedbackMessage}
          feedbackTone={feedbackTone}
          formErrorMessage={busFormErrors.general}
          formErrors={busFormErrors}
          isLoadingBuses={isLoadingBuses}
          isModalOpen={isBusModalOpen}
          isSavingBus={isSavingBus}
          lastPage={lastPage}
          onCapacityChange={(value) => {
            clearBusFormErrors();
            setCapacityInput(value.replace(/[^\d]/g, ""));
          }}
          onClearSearch={() => {
            clearFeedback();
            setSearchInput("");
            void refreshOrMove(1, "");
          }}
          onCloseModal={closeBusModal}
          onDeleteBus={confirmDeleteBus}
          onEditBus={startEditing}
          onOpenCreateModal={openCreateBusModal}
          onPageChange={(nextPage) => {
            void refreshOrMove(nextPage, appliedSearch);
          }}
          onPlateChange={(value) => {
            clearBusFormErrors();
            setPlateInput(sanitizePlate(value));
          }}
          onRefresh={() => {
            void loadBuses(page, appliedSearch);
          }}
          onSearch={() => {
            clearFeedback();
            void refreshOrMove(1, searchInput.trim());
          }}
          onSubmit={() => {
            void handleSubmitBus();
          }}
          page={page}
          plateInput={plateInput}
          searchInput={searchInput}
          setSearchInput={(value) => {
            setSearchInput(sanitizePlate(value));
          }}
          totalBuses={totalBuses}
          visibleCapacity={visibleCapacity}
        />
      );
    }

    if (activeSection === "students") {
      return (
        <PlaceholderSection
          actionLabel="alunos"
          description="A estrutura desta secao ja esta pronta para receber CRUD de alunos com busca, formulario e lista administrativa."
          icon={GraduationCap}
          title="Alunos"
        />
      );
    }

    return (
      <PlaceholderSection
        actionLabel="UniHub"
        description="Aqui entra o cadastro de dispositivos, pairing, vinculo com onibus e manutencao do modulo de campo."
        icon={Cpu}
        title="UniHub"
      />
    );
  }

  if (!canViewCompanyAdmin) {
    return (
      <SafeAreaView className="flex-1 bg-background-50">
        <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 120 }}>
          <View className="gap-5">
            <Text className="text-[32px] font-bold leading-9 text-typography-950">
              Cadastros
            </Text>

            <View className="rounded-[28px] bg-red-50 px-5 py-5">
              <Text className="text-xs font-semibold uppercase tracking-[1.5px] text-red-700">
                Acesso restrito
              </Text>
              <Text className="mt-2 text-2xl font-bold text-red-900">
                Esta area e exclusiva para ADMIN.
              </Text>
              <Text className="mt-2 text-sm leading-6 text-red-700">
                PLATFORM_ADMIN segue o fluxo da plataforma. DRIVER, COORDINATOR e
                USER entram em telas operacionais ou de acompanhamento, sem acesso
                ao hub de cadastros.
              </Text>
              {sessionRoles.length > 0 ? (
                <Text className="mt-3 text-xs font-semibold uppercase tracking-[1.5px] text-red-600">
                  Perfis encontrados: {sessionRoles.join(", ")}
                </Text>
              ) : null}
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background-50">
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 120 }}>
        <View className="gap-5">
          <Text className="text-[32px] font-bold leading-9 text-typography-950">
            Cadastros
          </Text>

          <View className="rounded-[32px] bg-background-0 p-4">
            {isCompactRail ? (
              <View>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ paddingRight: 8 }}
                >
                  <View className="flex-row gap-3">
                    {catalogSections.map((section) => (
                      <CatalogNavItem
                        key={section.key}
                        active={activeSection === section.key}
                        compact
                        onPress={() => {
                          selectSection(section.key);
                        }}
                        section={section}
                      />
                    ))}
                  </View>
                </ScrollView>

                <View className="mt-5">{renderActiveSection()}</View>
              </View>
            ) : (
              <View className="flex-row gap-4">
                <View style={{ width: 250 }}>
                  <View className="gap-3">
                    {catalogSections.map((section) => (
                      <CatalogNavItem
                        key={section.key}
                        active={activeSection === section.key}
                        compact={false}
                        onPress={() => {
                          selectSection(section.key);
                        }}
                        section={section}
                      />
                    ))}
                  </View>
                </View>

                <View className="flex-1">{renderActiveSection()}</View>
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
