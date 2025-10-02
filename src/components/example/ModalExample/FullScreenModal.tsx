"use client";
import { useModal } from "@/hooks/useModal";

import Button from "../../ui/button/Button";
import { Modal } from "../../ui/modal";
import PollResult from "@/components/sheet/PollResult";

export default function FullScreenModal() {

  const data = [
    {
      title: "hbdskjbkjsdbdkjsd",
      options: ["sadasdsad","sadasdsadff","zcxxcvcb","qwpewieo"],
      votes: [1,2,4,56],
      category: "category 1",
      type: "single_choice",
      participants: 15
    },
    {
      title: "hasdadssadkjsd",
      options: ["sadasdsadff","zcxxcvcb","qwpewieo"],
      votes: [1,2,6],
      category: "category 2",
      type: "multi_choice",
      participants: 15
    },
    {
      title: "asjdjkxlczjkxjxkj",
      options: ["sadasdszX","zxcvcb","qwpewieo","fmjdkfhd","abfcsafwc"],
      votes: [1,2,6,1,7],
      category: "category 2",
      type: "slide",
      participants: 18
    }


  ]


  const {
    isOpen: isFullscreenModalOpen,
    openModal: openFullscreenModal,
    closeModal: closeFullscreenModal,
  } = useModal();
  const handleSave = () => {
    // Handle save logic here
    console.log("Saving changes...");
    closeFullscreenModal();
  };
  return (
    <div>
      <Button size="sm" onClick={openFullscreenModal}>
        Analyze
      </Button>
      <Modal
        isOpen={isFullscreenModalOpen}
        onClose={closeFullscreenModal}
        isFullscreen={true}
        showCloseButton={true}
      >
        <div className="fixed top-0 left-0 flex flex-col justify-between w-full h-screen p-6 overflow-x-hidden overflow-y-auto bg-white dark:bg-gray-900 lg:p-10">
          <div>
            <h4 className="font-semibold text-gray-800 mb-7 text-title-sm dark:text-white/90">
              Poll Result
            </h4>
            <div className="flex flex-row justify-between items-center">
              <span className="w-[40%] h-0 border-[1px] "/>
              <span className="text-sm lg:text-lg">Category 1</span>
              <span className="w-[40%] h-0 border-[1px] "/>
            </div>
            <div>
              {
                data.map((item, index) => (
                    <PollResult key={index} title={item.title} options={item.options} votes={item.votes} category={item.category} type={item.type} participants={item.participants}/>
                ))
              }
            </div>

          </div>
          <div className="flex items-center justify-end w-full gap-3 mt-8">
            <Button size="sm" variant="outline" onClick={closeFullscreenModal}>
              Close
            </Button>
            <Button size="sm" onClick={handleSave}>
              Save as PDF
            </Button>
            <Button size="sm" onClick={handleSave}>
              Save as CSV
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
