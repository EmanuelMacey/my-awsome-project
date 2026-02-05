
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Linking,
  Platform,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../config/supabase';
import { theme } from '../../styles/theme';
import { LocationPicker } from '../../components/LocationPicker';
import * as DocumentPicker from 'expo-document-picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { PaymentMethodSelector } from '../../components/PaymentMethodSelector';
import { ReceiptModal } from '../../components/ReceiptModal';
import { getErrandSubcategories, createErrand, getErrandById, calculateErrandPrice } from '../../api/errands';
import { Errand, ErrandSubcategory } from '../../types/errand.types';

export default function CreateErrandScreen() {
  const { user } = useAuth();
  const params = useLocalSearchParams();
  const categoryId = params.categoryId as string;
  const subcategoryId = params.subcategoryId as string;

  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 6;

  const [subcategory, setSubcategory] = useState<ErrandSubcategory | null>(null);
  const [loadingSubcategory, setLoadingSubcategory] = useState(true);

  const [instructions, setInstructions] = useState('');
  const [customDescription, setCustomDescription] = useState('');
  const [additionalNotes, setAdditionalNotes] = useState('');

  const [pickupAddress, setPickupAddress] = useState('');
  const [pickupLatitude, setPickupLatitude] = useState<number | null>(null);
  const [pickupLongitude, setPickupLongitude] = useState<number | null>(null);
  const [dropoffAddress, setDropoffAddress] = useState('');
  const [dropoffLatitude, setDropoffLatitude] = useState<number | null>(null);
  const [dropoffLongitude, setDropoffLongitude] = useState<number | null>(null);

  const [basePrice, setBasePrice] = useState(1000);
  const [serviceFee, setServiceFee] = useState(200);
  const [distanceFee, setDistanceFee] = useState(0);
  const [totalPrice, setTotalPrice] = useState(1200);

  const [isAsap, setIsAsap] = useState(true);
  const [scheduledTime, setScheduledTime] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  const [documents, setDocuments] = useState<any[]>([]);
  const [uploadingDocuments, setUploadingDocuments] = useState(false);

  const [paymentMethod, setPaymentMethod] = useState<'cash'>('cash');

  const [submitting, setSubmitting] = useState(false);
  const [createdErrand, setCreatedErrand] = useState<Errand | null>(null);
  const [showReceipt, setShowReceipt] = useState(false);

  const fetchSubcategory = useCallback(async () => {
    try {
      setLoadingSubcategory(true);
      const subcategories = await getErrandSubcategories(categoryId);
      const found = subcategories.find(s => s.id === subcategoryId);
      if (found) {
        setSubcategory(found);
      } else {
        Alert.alert('Error', 'Subcategory not found');
        router.back();
      }
    } catch (error: any) {
      console.error('Error fetching subcategory:', error);
      Alert.alert('Error', 'Failed to load errand details');
      router.back();
    } finally {
      setLoadingSubcategory(false);
    }
  }, [categoryId, subcategoryId]);

  useEffect(() => {
    if (!user) {
      Alert.alert('Authentication Required', 'You must be logged in to create an errand.');
      router.back();
      return;
    }

    fetchSubcategory();
  }, [user, fetchSubcategory]);

  const calculatePricing = useCallback(() => {
    if (!pickupLatitude || !pickupLongitude || !dropoffLatitude || !dropoffLongitude) {
      return;
    }

    const R = 6371;
    const dLat = ((dropoffLatitude - pickupLatitude) * Math.PI) / 180;
    const dLon = ((dropoffLongitude - pickupLongitude) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((pickupLatitude * Math.PI) / 180) *
        Math.cos((dropoffLatitude * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;

    const pricing = calculateErrandPrice(1000, distance, 'low');
    setBasePrice(pricing.basePrice);
    setServiceFee(pricing.serviceFee);
    setDistanceFee(pricing.distanceFee);
    setTotalPrice(pricing.totalPrice);
  }, [pickupLatitude, pickupLongitude, dropoffLatitude, dropoffLongitude]);

  useEffect(() => {
    if (pickupLatitude && pickupLongitude && dropoffLatitude && dropoffLongitude) {
      calculatePricing();
    }
  }, [pickupLatitude, pickupLongitude, dropoffLatitude, dropoffLongitude, calculatePricing]);

  const canProceedFromStep1 = () => {
    if (!instructions.trim()) return false;
    if (subcategory?.name.toLowerCase().includes('custom') && !customDescription.trim()) {
      return false;
    }
    return true;
  };

  const canProceedFromStep2 = () => {
    return (
      pickupAddress.trim().length > 0 &&
      pickupLatitude !== null &&
      pickupLongitude !== null &&
      dropoffAddress.trim().length > 0 &&
      dropoffLatitude !== null &&
      dropoffLongitude !== null
    );
  };

  const canProceedFromStep3 = () => {
    if (isAsap) return true;
    if (scheduledTime) {
      return scheduledTime > new Date();
    }
    return false;
  };

  const canProceedFromStep4 = () => true;

  const canProceedFromStep5 = () => true;

  const handleNext = () => {
    if (currentStep === 1 && !canProceedFromStep1()) {
      if (!instructions.trim()) {
        Alert.alert('Required Field', 'Please provide instructions for this errand.');
      } else if (subcategory?.name.toLowerCase().includes('custom') && !customDescription.trim()) {
        Alert.alert('Required Field', 'Custom description is required for this service.');
      }
      return;
    }

    if (currentStep === 2 && !canProceedFromStep2()) {
      Alert.alert('Required Fields', 'Please provide both pickup and drop-off locations with coordinates.');
      return;
    }

    if (currentStep === 3 && !canProceedFromStep3()) {
      Alert.alert('Invalid Schedule', 'Please select a valid future date and time, or choose ASAP.');
      return;
    }

    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    } else {
      router.back();
    }
  };

  const handlePickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/*', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets?.length) {
        const file = result.assets[0];
        if (file.size && file.size > 10 * 1024 * 1024) {
          Alert.alert('File Too Large', 'Maximum file size is 10MB');
          return;
        }
        setDocuments(prev => [...prev, file]);
      }
    } catch (error) {
      console.error('Error picking document:', error);
      Alert.alert('Error', 'Failed to pick document');
    }
  };

  const handleRemoveDocument = (index: number) => {
    setDocuments(prev => prev.filter((_, i) => i !== index));
  };

  const uploadDocuments = async (errandId: string): Promise<string[]> => {
    const uploadedUrls: string[] = [];

    for (const doc of documents) {
      try {
        const timestamp = Date.now();
        const fileName = `${errandId}/${timestamp}_${doc.name}`;

        console.log('Would upload document:', fileName);
      } catch (error) {
        console.error('Error uploading document:', error);
      }
    }

    return uploadedUrls;
  };

  const handleSubmit = async () => {
    if (!user) {
      Alert.alert('Error', 'You must be logged in');
      return;
    }

    setSubmitting(true);

    try {
      console.log('Creating errand with payment method: cash');
      
      const errandData = {
        customerId: user.id,
        categoryId: categoryId,
        subcategoryId: subcategoryId,
        pickupAddress: pickupAddress,
        pickupLatitude: pickupLatitude ?? undefined,
        pickupLongitude: pickupLongitude ?? undefined,
        dropoffAddress: dropoffAddress,
        dropoffLatitude: dropoffLatitude ?? undefined,
        dropoffLongitude: dropoffLongitude ?? undefined,
        instructions: instructions,
        notes: additionalNotes || undefined,
        customDescription: customDescription || undefined,
        scheduledTime: scheduledTime ? scheduledTime.toISOString() : undefined,
        isAsap: isAsap,
        basePrice: basePrice,
        distanceFee: distanceFee,
        complexityFee: 0,
        totalPrice: totalPrice,
        paymentMethod: 'cash',
      };

      console.log('Creating errand with data:', errandData);
      const errand = await createErrand(errandData);
      console.log('Errand created:', errand);

      if (documents.length > 0) {
        setUploadingDocuments(true);
        await uploadDocuments(errand.id);
        setUploadingDocuments(false);
      }

      const fullErrand = await getErrandById(errand.id);
      setCreatedErrand(fullErrand);

      setShowReceipt(true);
    } catch (error: any) {
      console.error('Error creating errand:', error);
      Alert.alert('Error', error.message || 'Failed to create errand. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCloseReceipt = () => {
    setShowReceipt(false);
    if (createdErrand) {
      router.replace(`/errands/detail/${createdErrand.id}`);
    }
  };

  const handleContactSupport = () => {
    const phoneNumber = '5926834060';
    const message = 'Hello, I need help with my errand on ErrandRunners.';
    const whatsappUrl = `whatsapp://send?phone=${phoneNumber}&text=${encodeURIComponent(message)}`;

    Linking.canOpenURL(whatsappUrl)
      .then(supported => {
        if (supported) {
          return Linking.openURL(whatsappUrl);
        } else {
          const webWhatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
          return Linking.openURL(webWhatsappUrl);
        }
      })
      .catch(err => {
        console.error('Error opening WhatsApp:', err);
        Alert.alert('Error', 'Could not open WhatsApp. Please contact us at 592-683-4060');
      });
  };

  if (loadingSubcategory) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {subcategory?.name || 'Create Errand'}
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.stepIndicator}>
        <Text style={styles.stepText}>Step {currentStep} of {totalSteps}</Text>
        <View style={styles.progressBar}>
          {Array.from({ length: totalSteps }).map((_, index) => (
            <View
              key={index}
              style={[
                styles.progressDot,
                index < currentStep && styles.progressDotActive,
              ]}
            />
          ))}
        </View>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        {currentStep === 1 && (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>📝 Errand Details</Text>

            <Text style={styles.label}>
              Instructions <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={styles.textArea}
              multiline
              placeholder="Provide detailed instructions for this errand..."
              placeholderTextColor={theme.colors.textSecondary}
              value={instructions}
              onChangeText={setInstructions}
              textAlignVertical="top"
            />

            {subcategory?.name.toLowerCase().includes('custom') && (
              <>
                <Text style={styles.label}>
                  Custom Description <Text style={styles.required}>*</Text>
                </Text>
                <TextInput
                  style={styles.textArea}
                  multiline
                  placeholder="Describe your custom errand request..."
                  placeholderTextColor={theme.colors.textSecondary}
                  value={customDescription}
                  onChangeText={setCustomDescription}
                  textAlignVertical="top"
                />
              </>
            )}

            <Text style={styles.label}>Additional Notes (Optional)</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Any additional notes or preferences..."
              placeholderTextColor={theme.colors.textSecondary}
              value={additionalNotes}
              onChangeText={setAdditionalNotes}
            />
          </View>
        )}

        {currentStep === 2 && (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>📍 Pickup & Drop-off Locations</Text>

            <View style={styles.locationSection}>
              <Text style={styles.locationSectionTitle}>
               <Text style={styles.required}>Pick up Location</Text>
              </Text>
              <LocationPicker
                onLocationSelected={(address, lat, lng) => {
                  setPickupAddress(address);
                  setPickupLatitude(lat);
                  setPickupLongitude(lng);
                }}
                initialAddress={pickupAddress}
                initialLatitude={pickupLatitude ?? undefined}
                initialLongitude={pickupLongitude ?? undefined}
              />
            </View>

            <View style={styles.locationSection}>
              <Text style={styles.locationSectionTitle}>
                <Text style={styles.required}>Drop off Location</Text>
              </Text>
              <LocationPicker
                onLocationSelected={(address, lat, lng) => {
                  setDropoffAddress(address);
                  setDropoffLatitude(lat);
                  setDropoffLongitude(lng);
                }}
                initialAddress={dropoffAddress}
                initialLatitude={dropoffLatitude ?? undefined}
                initialLongitude={dropoffLongitude ?? undefined}
              />
            </View>

            {pickupLatitude && pickupLongitude && dropoffLatitude && dropoffLongitude && (
              <View style={styles.pricingPreview}>
                <Text style={styles.pricingPreviewText}>
                  💰 Estimated Total: GYD ${totalPrice.toFixed(2)}
                </Text>
              </View>
            )}
          </View>
        )}

        {currentStep === 3 && (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>⏰ Schedule</Text>

            <TouchableOpacity
              style={[styles.scheduleOption, isAsap && styles.scheduleOptionActive]}
              onPress={() => {
                setIsAsap(true);
                setScheduledTime(null);
              }}
            >
              <View style={styles.radioButton}>
                {isAsap && <View style={styles.radioButtonInner} />}
              </View>
              <View style={styles.scheduleOptionContent}>
                <Text style={styles.scheduleOptionTitle}>ASAP</Text>
                <Text style={styles.scheduleOptionDescription}>
                  Start this errand as soon as possible
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.scheduleOption, !isAsap && styles.scheduleOptionActive]}
              onPress={() => setIsAsap(false)}
            >
              <View style={styles.radioButton}>
                {!isAsap && <View style={styles.radioButtonInner} />}
              </View>
              <View style={styles.scheduleOptionContent}>
                <Text style={styles.scheduleOptionTitle}>Schedule for Later</Text>
                <Text style={styles.scheduleOptionDescription}>
                  Choose a specific date and time
                </Text>
              </View>
            </TouchableOpacity>

            {!isAsap && (
              <View style={styles.dateTimeContainer}>
                <TouchableOpacity
                  style={styles.dateTimeButton}
                  onPress={() => setShowDatePicker(true)}
                >
                  <Text style={styles.dateTimeButtonText}>
                    📅 {scheduledTime ? scheduledTime.toLocaleDateString() : 'Select Date'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.dateTimeButton}
                  onPress={() => setShowTimePicker(true)}
                >
                  <Text style={styles.dateTimeButtonText}>
                    🕐 {scheduledTime ? scheduledTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Select Time'}
                  </Text>
                </TouchableOpacity>

                {showDatePicker && (
                  <DateTimePicker
                    value={scheduledTime || new Date()}
                    mode="date"
                    display="default"
                    minimumDate={new Date()}
                    onChange={(event, selectedDate) => {
                      setShowDatePicker(Platform.OS === 'ios');
                      if (selectedDate) {
                        const newDate = scheduledTime || new Date();
                        newDate.setFullYear(selectedDate.getFullYear());
                        newDate.setMonth(selectedDate.getMonth());
                        newDate.setDate(selectedDate.getDate());
                        setScheduledTime(newDate);
                      }
                    }}
                  />
                )}

                {showTimePicker && (
                  <DateTimePicker
                    value={scheduledTime || new Date()}
                    mode="time"
                    display="default"
                    onChange={(event, selectedTime) => {
                      setShowTimePicker(Platform.OS === 'ios');
                      if (selectedTime) {
                        const newDate = scheduledTime || new Date();
                        newDate.setHours(selectedTime.getHours());
                        newDate.setMinutes(selectedTime.getMinutes());
                        setScheduledTime(newDate);
                      }
                    }}
                  />
                )}
              </View>
            )}
          </View>
        )}

        {currentStep === 4 && (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>📎 Documents (Optional)</Text>
            <Text style={styles.stepDescription}>
              Upload any relevant documents (PDF, images, Word). Max 10MB per file.
            </Text>

            <TouchableOpacity style={styles.uploadButton} onPress={handlePickDocument}>
              <Text style={styles.uploadButtonText}>+ Add Document</Text>
            </TouchableOpacity>

            {documents.map((doc, index) => (
              <View key={index} style={styles.documentRow}>
                <Text style={styles.documentName} numberOfLines={1}>
                  📄 {doc.name}
                </Text>
                <TouchableOpacity onPress={() => handleRemoveDocument(index)}>
                  <Text style={styles.documentRemove}>✕</Text>
                </TouchableOpacity>
              </View>
            ))}

            {documents.length === 0 && (
              <View style={styles.emptyDocuments}>
                <Text style={styles.emptyDocumentsText}>No documents added</Text>
              </View>
            )}
          </View>
        )}

        {currentStep === 5 && (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>💳 Payment Method</Text>
            <Text style={styles.stepDescription}>
              Cash on Delivery is the only payment method available
            </Text>

            <PaymentMethodSelector
              selectedMethod={paymentMethod}
              onSelectMethod={setPaymentMethod}
            />
          </View>
        )}

        {currentStep === 6 && (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>✅ Confirm Your Errand</Text>

            <View style={styles.summaryCard}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Service:</Text>
                <Text style={styles.summaryValue}>{subcategory?.name}</Text>
              </View>

              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Pickup:</Text>
                <Text style={styles.summaryValue} numberOfLines={2}>
                  {pickupAddress}
                </Text>
              </View>

              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Drop-off:</Text>
                <Text style={styles.summaryValue} numberOfLines={2}>
                  {dropoffAddress}
                </Text>
              </View>

              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Schedule:</Text>
                <Text style={styles.summaryValue}>
                  {isAsap
                    ? 'ASAP'
                    : scheduledTime
                    ? `${scheduledTime.toLocaleDateString()} at ${scheduledTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                    : 'Not set'}
                </Text>
              </View>

              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Documents:</Text>
                <Text style={styles.summaryValue}>{documents.length} file(s)</Text>
              </View>

              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Payment:</Text>
                <Text style={styles.summaryValue}>Cash on Delivery</Text>
              </View>
            </View>

            <View style={styles.pricingCard}>
              <Text style={styles.pricingCardTitle}>Price Breakdown</Text>
              <View style={styles.pricingRow}>
                <Text style={styles.pricingLabel}>Base Price:</Text>
                <Text style={styles.pricingValue}>GYD ${basePrice.toFixed(2)}</Text>
              </View>
              <View style={styles.pricingRow}>
                <Text style={styles.pricingLabel}>Service Fee:</Text>
                <Text style={styles.pricingValue}>GYD ${serviceFee.toFixed(2)}</Text>
              </View>
              <View style={styles.pricingRow}>
                <Text style={styles.pricingLabel}>Distance Fee:</Text>
                <Text style={styles.pricingValue}>GYD ${distanceFee.toFixed(2)}</Text>
              </View>
              <View style={styles.pricingDivider} />
              <View style={styles.pricingRow}>
                <Text style={styles.pricingTotalLabel}>Total:</Text>
                <Text style={styles.pricingTotalValue}>GYD ${totalPrice.toFixed(2)}</Text>
              </View>
            </View>

            <View style={styles.supportCard}>
              <Text style={styles.supportTitle}>Need Help?</Text>
              <Text style={styles.supportText}>Contact Support</Text>
              <TouchableOpacity style={styles.whatsappButton} onPress={handleContactSupport}>
                <Text style={styles.whatsappButtonText}>📞 WhatsApp: 592-721 9769</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.footerBackButton} onPress={handleBack}>
          <Text style={styles.footerBackButtonText}>
            {currentStep === 1 ? 'Cancel' : 'Back'}
          </Text>
        </TouchableOpacity>

        {currentStep < totalSteps ? (
          <TouchableOpacity
            style={[
              styles.footerNextButton,
              (currentStep === 1 && !canProceedFromStep1()) ||
              (currentStep === 2 && !canProceedFromStep2()) ||
              (currentStep === 3 && !canProceedFromStep3())
                ? styles.footerButtonDisabled
                : {},
            ]}
            onPress={handleNext}
          >
            <Text style={styles.footerNextButtonText}>Next</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.footerSubmitButton, submitting && styles.footerButtonDisabled]}
            onPress={handleSubmit}
            disabled={submitting}
          >
            {submitting || uploadingDocuments ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.footerSubmitButtonText}>Confirm & Submit</Text>
            )}
          </TouchableOpacity>
        )}
      </View>

      {createdErrand && (
        <ReceiptModal
          visible={showReceipt}
          onClose={handleCloseReceipt}
          errand={createdErrand}
          type="errand"
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F7FA',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 15,
    color: '#6B7280',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingBottom: 16,
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    padding: 8,
  },
  backButtonText: {
    fontSize: 16,
    color: theme.colors.primary,
    fontWeight: '600',
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
    textAlign: 'center',
    marginHorizontal: 8,
  },
  headerSpacer: {
    width: 60,
  },
  stepIndicator: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  stepText: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.primary,
    textAlign: 'center',
    marginBottom: 12,
  },
  progressBar: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  progressDot: {
    width: 40,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#E5E7EB',
  },
  progressDotActive: {
    backgroundColor: theme.colors.primary,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 120,
  },
  stepContainer: {
  },
  stepTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  stepDescription: {
    fontSize: 15,
    color: '#6B7280',
    marginBottom: 20,
    lineHeight: 22,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 8,
    marginTop: 16,
  },
  required: {
    color: '#EF4444',
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    padding: 14,
    fontSize: 15,
    color: '#1A1A1A',
    backgroundColor: '#FFFFFF',
  },
  textArea: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    padding: 14,
    minHeight: 120,
    fontSize: 15,
    color: '#1A1A1A',
    backgroundColor: '#FFFFFF',
    textAlignVertical: 'top',
  },
  locationSection: {
    marginBottom: 24,
  },
  locationSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 12,
  },
  pricingPreview: {
    marginTop: 20,
    padding: 16,
    backgroundColor: theme.colors.primary + '20',
    borderRadius: 10,
    alignItems: 'center',
  },
  pricingPreviewText: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.primary,
  },
  scheduleOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    marginBottom: 12,
  },
  scheduleOptionActive: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primary + '10',
  },
  radioButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  radioButtonInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: theme.colors.primary,
  },
  scheduleOptionContent: {
    flex: 1,
  },
  scheduleOptionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  scheduleOptionDescription: {
    fontSize: 14,
    color: '#6B7280',
  },
  dateTimeContainer: {
    marginTop: 16,
    gap: 12,
  },
  dateTimeButton: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    alignItems: 'center',
  },
  dateTimeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  uploadButton: {
    padding: 16,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: theme.colors.primary,
    borderRadius: 10,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginBottom: 16,
  },
  uploadButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.primary,
  },
  documentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    marginBottom: 8,
  },
  documentName: {
    flex: 1,
    fontSize: 14,
    color: '#1A1A1A',
    marginRight: 12,
  },
  documentRemove: {
    fontSize: 20,
    color: '#EF4444',
    fontWeight: '700',
    paddingHorizontal: 8,
  },
  emptyDocuments: {
    padding: 32,
    alignItems: 'center',
  },
  emptyDocumentsText: {
    fontSize: 15,
    color: '#9CA3AF',
  },
  summaryCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  summaryRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  summaryLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#6B7280',
    width: 100,
  },
  summaryValue: {
    flex: 1,
    fontSize: 15,
    color: '#1A1A1A',
  },
  pricingCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: theme.colors.primary,
  },
  pricingCardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 12,
  },
  pricingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  pricingLabel: {
    fontSize: 15,
    color: '#6B7280',
  },
  pricingValue: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  pricingDivider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 12,
  },
  pricingTotalLabel: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  pricingTotalValue: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.primary,
  },
  supportCard: {
    backgroundColor: theme.colors.primary + '10',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.primary + '30',
  },
  supportTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  supportText: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 12,
  },
  whatsappButton: {
    backgroundColor: '#25D366',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  whatsappButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    gap: 12,
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  footerBackButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: theme.colors.primary,
    alignItems: 'center',
  },
  footerBackButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.primary,
  },
  footerNextButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
  },
  footerNextButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  footerSubmitButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
  },
  footerSubmitButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  footerButtonDisabled: {
    opacity: 0.5,
  },
});
