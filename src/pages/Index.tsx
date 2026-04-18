import { AppNav } from "@/components/AppNav";
import { ChatView } from "@/components/chat/ChatView";
import { JobsView } from "@/components/jobs/JobsView";
import { N8nWebhookTester } from "@/components/dev/N8nWebhookTester";
import { AppTabProvider, useAppTab } from "@/contexts/AppTabContext";
import { ChatProvider } from "@/contexts/ChatContext";
import { JobsProvider } from "@/contexts/JobsContext";

function AppShell() {
  const { tab } = useAppTab();
  return (
    <div className="min-h-screen bg-gradient-subtle">
      <AppNav />
      <N8nWebhookTester />
      <main>
        <div className={tab === "chat" ? "block" : "hidden"}>
          <ChatView />
        </div>
        <div className={tab === "jobs" ? "block" : "hidden"}>
          <JobsView />
        </div>
      </main>
    </div>
  );
}

const Index = () => (
  <ChatProvider>
    <JobsProvider>
      <AppTabProvider>
        <AppShell />
      </AppTabProvider>
    </JobsProvider>
  </ChatProvider>
);

export default Index;
