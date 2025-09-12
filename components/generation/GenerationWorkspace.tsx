"use client";

// no-op
import { cn } from "@/libs/utils";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ModeSelector } from "./ModeSelector";
import { ImageUpload } from "./ImageUpload";
import { PresetSelectors } from "./PresetSelectors";
import { PromptInput } from "./PromptInput";
import { GenerationProgress } from "./GenerationProgress";
import { ResultsGrid } from "./ResultsGrid";
import { useGeneration } from "@/contexts/GenerationContext";
import { useGenerationSubmit } from "@/hooks/useGenerationSubmit";
import { useGenerationStatus } from "@/hooks/useGenerationStatus";
import runtimeConfig from "@/libs/app-config/runtime";
import { Wand2, AlertCircle, Zap } from "lucide-react";
import { toastSuccess, toastError } from "@/components/shared/Toast";
import { apiFetch } from "@/libs/api/http";
import { useState } from "react";
import { CollectionPickerDialog } from "@/components/collections/CollectionPickerDialog";

export function GenerationWorkspace() {
  const {
    state,
    setMode,
    setInput1File,
    setInput2File,
    setRoomType,
    setStyle,
    setPrompt,
    // removed settings setters
    resetForm,
    // canGenerate,
    missingRequirements
  } = useGeneration();

  const { submitGeneration, isSubmitting, canSubmit } = useGenerationSubmit({
    onSuccess: (jobId) => {
      console.log('Generation started:', jobId);
    },
    onError: (error) => {
      console.error('Generation failed:', error);
    }
  });

  // Set up status polling
  useGenerationStatus({
    onComplete: (results) => {
      toastSuccess(`Generated ${results.length} design variant${results.length !== 1 ? 's' : ''}!`);
    },
    onError: (error) => {
      toastError(`Generation failed: ${error}`);
    },
    onTimeout: () => {
      toastError('Generation is taking longer than expected. Please try again.');
    }
  });

  // Defaults are initialized in context. No-op here to avoid redundant updates.

  const showInput1 = state.mode !== 'imagine';
  const showInput2 = state.mode === 'compose';

  const handleAddToFavorites = async (renderId: string) => {
    await apiFetch('/api/v1/collections/favorites/items', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ renderId })
    });
  };

  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerRenderId, setPickerRenderId] = useState<string | null>(null);

  const handleAddToCollection = (renderId: string) => {
    setPickerRenderId(renderId);
    setPickerOpen(true);
  };

  const handleRerun = () => {
    // Reset generation state but keep form values
    resetForm();
    // Optionally submit again
    if (canSubmit) {
      submitGeneration();
    }
  };

  return (
    <div className="space-y-8">
      {/* Mode Selection */}
      <ModeSelector
        selectedMode={state.mode}
        onModeChange={setMode}
        disabled={state.isGenerating}
      />

      {/* Input Areas - Dynamic based on mode */}
      {(showInput1 || showInput2) && (
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold mb-2">
              {state.mode === 'compose' ? 'Input Images' : 'Room Image'}
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              {state.mode === 'compose' 
                ? 'Upload your base room and reference images'
                : state.mode === 'staging'
                ? 'Upload an empty or sparsely furnished room'
                : 'Upload a room you want to redesign'
              }
            </p>
          </div>

          <div className={cn(
            "grid gap-6",
            showInput2 ? "grid-cols-1 lg:grid-cols-2" : "grid-cols-1 max-w-md mx-auto"
          )}>
            {showInput1 && (
              <ImageUpload
                label={state.mode === 'compose' ? 'Base Room Image' : 'Room Image'}
                description={
                  state.mode === 'compose' 
                    ? 'The room architecture to keep'
                    : 'The room you want to transform'
                }
                value={state.input1File}
                onChange={setInput1File}
                required
                disabled={state.isGenerating}
                maxSizeMB={runtimeConfig.limits.maxUploadsMB}
              />
            )}

            {showInput2 && (
              <ImageUpload
                label="Reference Image"
                description="Style, object, or inspiration to incorporate"
                value={state.input2File}
                onChange={setInput2File}
                required
                disabled={state.isGenerating}
                maxSizeMB={runtimeConfig.limits.maxUploadsMB}
              />
            )}
          </div>
        </div>
      )}

      {/* Presets */}
      <PresetSelectors
        roomTypes={runtimeConfig.presets.roomTypes}
        styles={runtimeConfig.presets.styles}
        selectedRoomType={state.roomType}
        selectedStyle={state.style}
        onRoomTypeChange={setRoomType}
        onStyleChange={setStyle}
        disabled={state.isGenerating}
      />

      {/* Prompt */}
      <PromptInput
        value={state.prompt}
        onChange={setPrompt}
        mode={state.mode}
        disabled={state.isGenerating}
      />

      {/* Settings removed in nano-banana migration */}

      {/* Validation Errors */}
      {missingRequirements.length > 0 && !state.isGenerating && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Please complete the following: {missingRequirements.join(', ')}
          </AlertDescription>
        </Alert>
      )}

      {/* Generate Button */}
      {/* Desktop/tablet center button */}
      <div className="hidden md:flex justify-center">
        <Button
          size="lg"
          onClick={submitGeneration}
          disabled={!canSubmit}
          className="px-8 py-3 text-lg font-semibold"
        >
          {isSubmitting ? (
            <>
              <Wand2 className="h-5 w-5 mr-2 animate-spin" />
              Starting Generation...
            </>
          ) : state.isGenerating ? (
            <>
              <Wand2 className="h-5 w-5 mr-2 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Zap className="h-5 w-5 mr-2" />
              Generate Design
            </>
          )}
        </Button>
      </div>

      {/* Mobile sticky CTA */}
      <div className="md:hidden fixed inset-x-0 bottom-0 z-30 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 p-3">
        <div className="max-w-3xl mx-auto">
          <Button
            size="lg"
            onClick={submitGeneration}
            disabled={!canSubmit}
            className="w-full text-base font-semibold"
          >
            {isSubmitting ? (
              <>
                <Wand2 className="h-5 w-5 mr-2 animate-spin" />
                Starting Generation...
              </>
            ) : state.isGenerating ? (
              <>
                <Wand2 className="h-5 w-5 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Zap className="h-5 w-5 mr-2" />
                Generate Design
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Generation Progress */}
      {state.isGenerating && (
        <GenerationProgress
          onCancel={() => {
            // Reset generation state
            console.log('Generation cancelled');
          }}
          showCancel={false} // Disable cancel for MVP
        />
      )}

      {/* Results */}
      {state.results && state.results.length > 0 && (
        <ResultsGrid
          results={state.results}
          mode={state.mode}
          roomType={state.roomType}
          style={state.style}
          prompt={state.prompt}
          onAddToFavorites={handleAddToFavorites}
          onAddToCollection={handleAddToCollection}
          onRerun={handleRerun}
        />
      )}

      {/* Collection Picker */}
      <CollectionPickerDialog
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        renderId={pickerRenderId}
        onAdded={() => toastSuccess('Added to collection')}
      />
    </div>
  );
}
