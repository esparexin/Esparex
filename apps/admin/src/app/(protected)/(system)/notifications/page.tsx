"use client";

import { AdminModuleTabs } from "@/components/layout/AdminModuleTabs";
import { AdminPageShell } from "@/components/layout/AdminPageShell";
import { notificationsTabs } from "@/components/layout/adminModuleTabSets";

import { useNotifications } from "./hooks/useNotifications";
import { BroadcastComposer } from "./components/BroadcastComposer";
import { NotificationHistory } from "./components/NotificationHistory";
import { NotificationFilters } from "./components/NotificationFilters";

export default function NotificationsPage() {
    const {
        // State
        history,
        loading,
        error,
        success,
        pagination,
        
        // Router state
        page,
        status,
        historyTargetType,
        searchInput,
        setSearchInput,
        replaceQueryState,

        // Composer
        sending,
        title, setTitle,
        body, setBody,
        targetType, setTargetType,
        targetValue, setTargetValue,
        actionUrl, setActionUrl,
        sendAt, setSendAt,
        handleSend,

        // Recipients
        recipientQuery, setRecipientQuery,
        recipientResults,
        recipientSearchLoading,
        recipientSearchError,
        selectedUsers,
        addRecipient,
        removeRecipient,
    } = useNotifications();

    return (
        <AdminPageShell
            title="Broadcast Console"
            description="Send outbound announcements, schedule delivery, and review broadcast history."
            tabs={<AdminModuleTabs tabs={notificationsTabs} />}
        >
            <div className="space-y-6">
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                    <BroadcastComposer
                        sending={sending}
                        title={title}
                        setTitle={setTitle}
                        body={body}
                        setBody={setBody}
                        targetType={targetType}
                        setTargetType={setTargetType}
                        targetValue={targetValue}
                        setTargetValue={setTargetValue}
                        actionUrl={actionUrl}
                        setActionUrl={setActionUrl}
                        sendAt={sendAt}
                        setSendAt={setSendAt}
                        handleSend={handleSend}
                        error={error}
                        success={success}
                        recipientQuery={recipientQuery}
                        setRecipientQuery={setRecipientQuery}
                        recipientResults={recipientResults}
                        recipientSearchLoading={recipientSearchLoading}
                        recipientSearchError={recipientSearchError}
                        selectedUsers={selectedUsers}
                        addRecipient={addRecipient}
                        removeRecipient={removeRecipient}
                    />

                    <NotificationHistory
                        history={history}
                        loading={loading}
                        page={page}
                        pagination={pagination}
                        onPageChange={(nextPage) => replaceQueryState({ page: nextPage > 1 ? nextPage : null })}
                        toolbar={
                            <NotificationFilters
                                searchInput={searchInput}
                                setSearchInput={setSearchInput}
                                status={status}
                                historyTargetType={historyTargetType}
                                onFilterChange={replaceQueryState}
                            />
                        }
                    />
                </div>
            </div>
        </AdminPageShell>
    );
}
