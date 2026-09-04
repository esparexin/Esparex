import React, { useState, useCallback } from 'react';
import { View, TouchableOpacity, ScrollView } from 'react-native';
import { AppText, Badge } from '@esparex/mobile-ui';
import { ListingSparePart } from '../../../domain/Listing';
import { NearbyRepairServicesSection } from './NearbyRepairServicesSection';
import { DescriptionSection } from './DescriptionSection';
import { AvailableSparePartsSection } from './AvailableSparePartsSection';

export type ListingTabKey = 'repair-shops' | 'description' | 'spare-parts';

interface ListingContentTabsProps {
  description?: string;
  spareParts?: ListingSparePart[];
  locationId?: string;
  listingCategoryId?: string;
  onTabChange?: (tab: ListingTabKey) => void;
}

interface TabDef {
  key: ListingTabKey;
  label: string;
  count?: number;
}

export const ListingContentTabs = ({
  description,
  spareParts,
  locationId,
  listingCategoryId,
  onTabChange,
}: ListingContentTabsProps) => {
  const [activeTab, setActiveTab] = useState<ListingTabKey>('repair-shops');

  const handleSelectTab = useCallback(
    (tabKey: ListingTabKey) => {
      setActiveTab(tabKey);
      onTabChange?.(tabKey);
    },
    [onTabChange]
  );

  const sparePartsCount = Array.isArray(spareParts) ? spareParts.length : 0;

  const tabs: TabDef[] = [
    { key: 'repair-shops', label: 'Repair Shops' },
    { key: 'description', label: 'Description' },
    {
      key: 'spare-parts',
      label: 'Spare Parts',
      count: sparePartsCount > 0 ? sparePartsCount : undefined,
    },
  ];

  return (
    <View className="bg-card border-b border-border">
      {/* 3-Tab Segmented Header */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerClassName="flex-row items-center px-4 border-b border-border"
      >
        {tabs.map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <TouchableOpacity
              key={tab.key}
              onPress={() => handleSelectTab(tab.key)}
              activeOpacity={0.7}
              hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
              accessibilityRole="tab"
              accessibilityState={{ selected: isActive }}
              accessibilityLabel={`${tab.label}${tab.count ? ` (${tab.count} items)` : ''}`}
              className={`flex-row items-center py-3.5 px-4 mr-2 border-b-2 -mb-px ${
                isActive ? 'border-primary' : 'border-transparent'
              }`}
            >
              <AppText
                variant="body"
                weight={isActive ? 'bold' : 'medium'}
                color={isActive ? 'brand' : 'muted'}
                className="mr-1.5"
              >
                {tab.label}
              </AppText>
              {typeof tab.count === 'number' && (
                <Badge
                  label={String(tab.count)}
                  variant={isActive ? 'brand' : 'default'}
                  size="sm"
                />
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Dynamic Tab Panel */}
      <View>
        {activeTab === 'repair-shops' && (
          <NearbyRepairServicesSection
            locationId={locationId}
            listingCategoryId={listingCategoryId}
          />
        )}
        {activeTab === 'description' && (
          <DescriptionSection description={description || ''} />
        )}
        {activeTab === 'spare-parts' && (
          <AvailableSparePartsSection spareParts={spareParts} />
        )}
      </View>
    </View>
  );
};
